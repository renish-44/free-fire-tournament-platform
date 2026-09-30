from fastapi import APIRouter, Depends, Query, HTTPException
from fastapi.responses import Response, StreamingResponse
from typing import Optional
from datetime import datetime
from bson import ObjectId
import csv
import io
import openpyxl
from openpyxl.styles import Font, PatternFill

from app.database.connection import db
from app.auth.deps import get_current_admin
from app.schemas.admin import AdminResponse

router = APIRouter(prefix="/api/admin/reports", tags=["admin_reports"])

def get_match_conditions(
    tournament_id: Optional[str],
    date_start: Optional[str],
    date_end: Optional[str],
    status: Optional[str],
    payment_status: Optional[str]
):
    match_conditions = []
    
    if tournament_id:
        match_conditions.append({"tournament_id": tournament_id})
    if status:
        match_conditions.append({"status": status.upper() if status.upper() != "PENDING" else "pending"})
    if payment_status:
        match_conditions.append({"payment.status": payment_status.upper()})
        
    if date_start or date_end:
        date_query = {}
        if date_start:
            try:
                date_query["$gte"] = datetime.strptime(date_start, "%Y-%m-%d")
            except:
                pass
        if date_end:
            try:
                # Add 1 day to include the entire end date
                date_query["$lte"] = datetime.strptime(date_end + " 23:59:59", "%Y-%m-%d %H:%M:%S")
            except:
                pass
        if date_query:
            match_conditions.append({"created_at": date_query})
            
    return {"$and": match_conditions} if match_conditions else {}


@router.get("/metrics")
async def get_report_metrics(
    tournament_id: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    pipeline = [
        {
            "$lookup": {
                "from": "payments",
                "localField": "registration_id",
                "foreignField": "registration_id",
                "as": "payment"
            }
        },
        {"$unwind": {"path": "$payment", "preserveNullAndEmptyArrays": True}}
    ]

    match_conds = get_match_conditions(tournament_id, date_start, date_end, status, payment_status)
    if match_conds:
        pipeline.append({"$match": match_conds})
        
    pipeline.append({
        "$group": {
            "_id": None,
            "total_registrations": {"$sum": 1},
            "verified_registrations": {
                "$sum": {"$cond": [{"$eq": ["$status", "CONFIRMED"]}, 1, 0]}
            },
            "pending_payments": {
                "$sum": {"$cond": [{"$eq": ["$payment.status", "PENDING"]}, 1, 0]}
            },
            "rejected_payments": {
                "$sum": {"$cond": [{"$eq": ["$payment.status", "REJECTED"]}, 1, 0]}
            },
            "total_revenue": {
                "$sum": {
                    "$cond": [{"$eq": ["$payment.status", "VERIFIED"]}, "$payment.amount_paid", 0]
                }
            }
        }
    })

    cursor = db.db.registrations.aggregate(pipeline)
    results = await cursor.to_list(1)
    
    metrics = {
        "total_registrations": 0,
        "verified_registrations": 0,
        "pending_payments": 0,
        "rejected_payments": 0,
        "total_revenue": 0,
        "available_slots": 0
    }
    
    if results:
        res = results[0]
        metrics["total_registrations"] = res.get("total_registrations", 0)
        metrics["verified_registrations"] = res.get("verified_registrations", 0)
        metrics["pending_payments"] = res.get("pending_payments", 0)
        metrics["rejected_payments"] = res.get("rejected_payments", 0)
        metrics["total_revenue"] = res.get("total_revenue", 0)

    # Calculate available slots if a specific tournament is selected
    if tournament_id:
        t = await db.db.tournaments.find_one({"_id": ObjectId(tournament_id)})
        if t:
            metrics["available_slots"] = max(0, t.get("maximum_slots", 0) - t.get("registered_count", 0))
    else:
        # Aggregate total available slots across all active tournaments
        t_cursor = db.db.tournaments.aggregate([
            {"$match": {"status": "PUBLISHED"}},
            {
                "$group": {
                    "_id": None,
                    "max": {"$sum": "$maximum_slots"},
                    "reg": {"$sum": "$registered_count"}
                }
            }
        ])
        t_res = await t_cursor.to_list(1)
        if t_res:
            metrics["available_slots"] = max(0, t_res[0].get("max", 0) - t_res[0].get("reg", 0))

    return metrics


@router.get("/export")
async def export_reports(
    format: str = Query("csv", pattern="^(csv|xlsx)$"),
    tournament_id: Optional[str] = None,
    date_start: Optional[str] = None,
    date_end: Optional[str] = None,
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
    current_admin: AdminResponse = Depends(get_current_admin)
):
    pipeline = [
        {
            "$addFields": {
                "converted_t_id": {"$toObjectId": "$tournament_id"}
            }
        },
        {
            "$lookup": {
                "from": "tournaments",
                "localField": "converted_t_id",
                "foreignField": "_id",
                "as": "tournament"
            }
        },
        {"$unwind": {"path": "$tournament", "preserveNullAndEmptyArrays": True}},
        {
            "$lookup": {
                "from": "payments",
                "localField": "registration_id",
                "foreignField": "registration_id",
                "as": "payment"
            }
        },
        {"$unwind": {"path": "$payment", "preserveNullAndEmptyArrays": True}}
    ]

    match_conds = get_match_conditions(tournament_id, date_start, date_end, status, payment_status)
    if match_conds:
        pipeline.append({"$match": match_conds})
        
    pipeline.append({"$sort": {"created_at": -1}})
    
    cursor = db.db.registrations.aggregate(pipeline)
    registrations = await cursor.to_list(None)

    # Prepare Data
    headers = [
        "Registration ID", "Tournament", "Team", "Captain", "Player 2", 
        "Player 3", "Player 4", "UIDs", "Phone", "Email", 
        "Amount", "UTR", "Payment Status", "Registration Status", "Submitted Date"
    ]
    
    rows = []
    for r in registrations:
        players = r.get("players", [])
        
        # Player names safely extracted
        captain = players[0].get("full_name", "") if len(players) > 0 else ""
        p2 = players[1].get("full_name", "") if len(players) > 1 else ""
        p3 = players[2].get("full_name", "") if len(players) > 2 else ""
        p4 = players[3].get("full_name", "") if len(players) > 3 else ""
        
        # UIDs concatenated
        uids = ", ".join([str(p.get("uid", "")) for p in players if p.get("uid")])
        
        # Contact info
        phone = players[0].get("whatsapp", "") if len(players) > 0 else ""
        email = players[0].get("email", "") if len(players) > 0 else ""
        
        # Payment info
        payment = r.get("payment") or {}
        
        rows.append([
            r.get("registration_id", ""),
            r.get("tournament", {}).get("name", "Unknown"),
            r.get("team_name", ""),
            captain, p2, p3, p4,
            uids, phone, email,
            payment.get("amount_paid", 0),
            payment.get("utr", ""),
            payment.get("status", "UNPAID"),
            r.get("status", ""),
            r.get("created_at", "").strftime("%Y-%m-%d %H:%M:%S") if r.get("created_at") else ""
        ])

    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(headers)
        writer.writerows(rows)
        
        return Response(
            content=output.getvalue(),
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename=tournament_report_{datetime.now().strftime('%Y%m%d%H%M')}.csv"}
        )
        
    elif format == "xlsx":
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "Registrations"
        
        # Write headers with styling
        ws.append(headers)
        header_fill = PatternFill(start_color="333333", end_color="333333", fill_type="solid")
        header_font = Font(color="FFFFFF", bold=True)
        
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
            
        # Write data
        for row in rows:
            ws.append(row)
            
        output = io.BytesIO()
        wb.save(output)
        
        return Response(
            content=output.getvalue(),
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": f"attachment; filename=tournament_report_{datetime.now().strftime('%Y%m%d%H%M')}.xlsx"}
        )
