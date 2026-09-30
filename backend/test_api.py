import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api"

# Keep track of state
state = {}

def print_result(name, condition):
    print(f"[{'PASS' if condition else 'FAIL'}] {name}")
    if not condition:
        print("FAILED TEST. EXITING.")
        exit(1)

def test_login():
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": "admin@example.com", "password": "change_this_in_production"})
    print_result("Login Success", res.status_code == 200)
    state['token'] = res.json()['access_token']
    
def test_unauthorized():
    res = requests.get(f"{BASE_URL}/admin/dashboard")
    print_result("Unauthorized Access Blocked", res.status_code == 401)

def test_create_tournament():
    headers = {"Authorization": f"Bearer {state['token']}"}
    payload = {
        "name": f"Test Tournament {uuid.uuid4().hex[:6]}",
        "game": "Free Fire",
        "mode": "SQUAD",
        "entry_fee": 100,
        "prize_pool": "10000",
        "maximum_slots": 2,
        "tournament_date": "2030-12-31T00:00:00Z",
        "start_time": "12:00",
        "registration_start": "2020-01-01T00:00:00Z",
        "registration_deadline": "2030-12-31T23:59:59Z",
        "organizer_name": "Test Org",
        "organizer_contact": "test@test.com",
        "upi_id": "test@upi",
        "status": "DRAFT"
    }
    res = requests.post(f"{BASE_URL}/tournaments", json=payload, headers=headers)
    print_result("Create Tournament", res.status_code == 200)
    state['t_id'] = res.json()['_id']
    state['slug'] = res.json()['slug']

def test_publish_tournament():
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = requests.post(f"{BASE_URL}/tournaments/{state['t_id']}/publish", headers=headers)
    print_result("Publish Tournament", res.status_code == 200)

def test_registration():
    payload = {
        "team_name": "Test Team 1",
        "players": [
            {"full_name": "P1", "ign": "IGN1", "uid": "111111", "whatsapp": "1234567890", "email": "p1@test.com", "role": "Captain"},
            {"full_name": "P2", "ign": "IGN2", "uid": "222222"},
            {"full_name": "P3", "ign": "IGN3", "uid": "333333"},
            {"full_name": "P4", "ign": "IGN4", "uid": "444444"}
        ],
        "custom_fields_data": {}
    }
    res = requests.post(f"{BASE_URL}/public/tournaments/{state['slug']}/register", json=payload)
    print_result("Registration", res.status_code == 200)
    state['reg_id'] = res.json()['registration_id']

def test_duplicate_uid():
    payload = {
        "team_name": "Test Team 2",
        "players": [
            {"full_name": "P1", "ign": "IGN1", "uid": "111111", "whatsapp": "1234567890", "email": "p1@test.com", "role": "Captain"},
            {"full_name": "P5", "ign": "IGN5", "uid": "555555"},
            {"full_name": "P6", "ign": "IGN6", "uid": "666666"},
            {"full_name": "P7", "ign": "IGN7", "uid": "777777"}
        ],
        "custom_fields_data": {}
    }
    res = requests.post(f"{BASE_URL}/public/tournaments/{state['slug']}/register", json=payload)
    print_result("Duplicate UID Blocked", res.status_code == 400)

def test_overbooking():
    # Register Team 2 (Valid)
    payload = {
        "team_name": "Test Team 2",
        "players": [
            {"full_name": "P5", "ign": "IGN5", "uid": "555555", "whatsapp": "1234567890", "email": "p5@test.com", "role": "Captain"},
            {"full_name": "P6", "ign": "IGN6", "uid": "666666"},
            {"full_name": "P7", "ign": "IGN7", "uid": "777777"},
            {"full_name": "P8", "ign": "IGN8", "uid": "888888"}
        ],
        "custom_fields_data": {}
    }
    res = requests.post(f"{BASE_URL}/public/tournaments/{state['slug']}/register", json=payload)
    print_result("Registration 2", res.status_code == 200)
    
    # Try Team 3 (Should fail due to slot limit = 2)
    payload['team_name'] = "Test Team 3"
    payload['players'][0]['uid'] = "999999"
    payload['players'][1]['uid'] = "101010"
    payload['players'][2]['uid'] = "1111111"
    payload['players'][3]['uid'] = "121212"
    res = requests.post(f"{BASE_URL}/public/tournaments/{state['slug']}/register", json=payload)
    print_result("Overbooking Blocked", res.status_code == 400)

def test_payment_submission():
    # Submit payment for reg 1
    payload = {
        "registration_id": state['reg_id'],
        "payment_method": "Google Pay",
        "payer_name": "Test Payer",
        "amount_paid": 100.0,
        "utr": "UTR123456789"
    }
    # Using multipart form-data to mock file upload
    # Since requests is tricky with files in json payload, we'll hit the multipart endpoint
    # wait, the endpoint is Form fields, not json!
    files = {
        "screenshot": ("test.png", b"fake_image_data", "image/png")
    }
    data = payload
    res = requests.post(f"{BASE_URL}/payments", data=data, files=files)
    print_result("Payment Submission", res.status_code == 200)
    state['pay_id'] = res.json()['payment_id']

def test_payment_verification():
    headers = {"Authorization": f"Bearer {state['token']}"}
    res = requests.put(f"{BASE_URL}/admin/payments/{state['pay_id']}/verify", headers=headers)
    print_result("Payment Verification", res.status_code == 200)

if __name__ == "__main__":
    try:
        test_login()
        test_unauthorized()
        test_create_tournament()
        test_publish_tournament()
        test_registration()
        test_duplicate_uid()
        test_overbooking()
        test_payment_submission()
        test_payment_verification()
        print("ALL TESTS PASSED!")
    except Exception as e:
        print("Exception:", e)
