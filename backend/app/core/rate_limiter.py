import time

from fastapi import HTTPException

MAX_REQUESTS = 5
WINDOW_SECONDS = 3600

requests_count = {}


def check_rate_limit(visitor_id: str):
    current_time = time.monotonic()
    if visitor_id not in requests_count:
        requests_count[visitor_id] = {"count": 1, "start_time": current_time}
        return True
    else:
        time_pass = current_time - requests_count[visitor_id]["start_time"]
        if time_pass >= WINDOW_SECONDS:
            requests_count[visitor_id]["count"] = 1
            requests_count[visitor_id]["start_time"] = current_time
            return True
        else:
            if requests_count[visitor_id]["count"] >= MAX_REQUESTS:
                raise HTTPException(status_code=429, detail="Too many requests")

            requests_count[visitor_id]["count"] += 1
            return True
