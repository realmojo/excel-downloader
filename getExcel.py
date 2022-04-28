import json
import logging
import os
import sys
import time
from pathlib import Path

import pandas as pd
import requests

CSP_HOST = "https://admin-csp.gsshop.com"
ALLOWD_IP = "203.247.143.20"

## 이 부분을 바꿔서 실행
USER_ID = "23372"
USER_PW = "wjdaksrud!@3"

FROM_DATE = "20220401"
TO_DATE = "20220413"

DOWNLOAD_DIR = "./"
SLEEP_INTERVAL = 1
##

# logger
logger = logging.getLogger()
logger.setLevel(logging.DEBUG)

stream_handler = logging.StreamHandler()
stream_handler.setLevel(logging.INFO)
log_format = logging.Formatter(fmt="[%(levelname)s] %(asctime)s : %(message)s")
stream_handler.setFormatter(log_format)

logger.addHandler(stream_handler)

# 1. login
content_type_headers = {
    "Content-Type": "application/json; charset=utf-8",
}

user_info = {"id": USER_ID, "pw": USER_PW}

try:
    auth_response = requests.post(
        f"{CSP_HOST}/api/authentication/login",
        headers=content_type_headers,
        data=json.dumps(user_info),
    )

    if auth_response.status_code == 200:
        JWT_TOKEN = auth_response.json()["token"]

        auth_headers = {
            "Authorization": f"Bearer {JWT_TOKEN}",
        }

except Exception as e:
    logger.info("failed to authenticate")
    logger.exception(e)
    sys.exit()


# 2. get live list
params = {"start": FROM_DATE, "end": TO_DATE}

try:
    live_list_response = requests.get(f"{CSP_HOST}/api/mobilelive/gs/list", headers=auth_headers, params=params)
    if live_list_response.status_code == 200:
        lives = live_list_response.json()["lives"]

        live_info_list = list(map(lambda x: {"liveNo": x["liveNo"], "title": x["title"], "start": x["start"]}, lives))
        live_info_list = sorted(live_info_list, key=lambda d: d["liveNo"])

except Exception as e:
    logger.info("failed to fetch live list")
    logger.exception(e)
    sys.exit()


if not Path(f"{DOWNLOAD_DIR}/archive").resolve().exists():
    os.mkdir(f"{DOWNLOAD_DIR}/archive")

# 3. excel_download
xff_header = {"x-forwarded-for": ALLOWD_IP}
headers = dict(**auth_headers, **content_type_headers, **xff_header)


for (idx, live_info) in enumerate(live_info_list):
    logger.info(f"download #{idx+1}")

    title = live_info["title"].replace("/", "")
    liveNo = live_info["liveNo"]
    start = live_info["start"]

    data = {"liveNos": [liveNo]}

    response = requests.post(
        f"{CSP_HOST}/export/chat/download/multi",
        headers=headers,
        data=json.dumps(data),
    )

    if response.status_code == 200:
        excel_file_path = Path(f"{DOWNLOAD_DIR}/archive").resolve().joinpath(f"{start}_{liveNo}_{title}.xlsx")

        with open(excel_file_path, "wb") as f:
            f.write(response.content)

    # time.sleep(SLEEP_INTERVAL)