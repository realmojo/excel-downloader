const fs = require("fs");
const axios = require("axios");

const moment = require("moment");
const xlsx = require("xlsx");
const p = require("path");

const CSP_HOST = "https://admin-csp.gsshop.com";
const ALLOWD_IP = "203.247.143.20";

const filterWords = [
  "샤하",
  "샤햐",
  "사하",
  "샤히",
  "사햐",
  "갸하",
  "가하",
  "갸햐",
  "가햐",
  "랴햐",
  "랴하",
  "라햐",
  "라하",
  "4햐",
  "4하",
  "ㅎㅇ",
  "하이",
  "헬로",
  "hi",
  "hello",
  "안녕",
  "ㅅㅎ",
  "샤바",
  "샤바",
  "사바",
  "사뱌",
  "샤뱌",
  "ㅅㅂ",
];

const getDirFile = (path) => {
  return new Promise((resolve) => {
    fs.readdir(path, (err, data) => {
      if (err) {
        return;
      }
      resolve(data);
    });
  });
};

const getReadFile = (filename) => {
  const sheet = xlsx.readFile(filename);
  const sheetName = sheet.SheetNames[0];
  const firstSheet = sheet.Sheets[sheetName]; // @details 시트의 제목 추출
  const jsonData = xlsx.utils.sheet_to_json(firstSheet, { defval: "" });
  return jsonData;
};

const getToken = async (id, pw) => {
  const url = `${CSP_HOST}/api/authentication/login`;
  const data = {
    id,
    pw,
  };
  return new Promise((resolve) => {
    axios.post(url, data).then((res) => {
      resolve(res.data.token);
    });
  });
};

const getInfoFile = () => {
  return new Promise((resolve) => {
    fs.readFile("./info.txt", "utf-8", (err, data) => {
      if (err) {
        throw new Error("no File");
      }

      const [id, pw, startDate, endDate] = data.split("\n");
      resolve({
        id,
        pw,
        startDate,
        endDate,
      });
    });
  });
};

const _sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

const getExcelList = async (token, startDate, endDate) => {
  const url = `${CSP_HOST}/api/mobilelive/gs/list?start=${startDate}&end=${endDate}`;
  const headers = {
    Authorization: `Bearer ${token}`,
  };
  return new Promise((resolve) => {
    axios.get(url, { headers }).then((res) => {
      resolve(items.status === "ok" ? items.lives : []);
    });
  });
};

const downloadExcelFile = (token, item) => {
  const url = `${CSP_HOST}/api/export/${item.liveNo}?toJson=Y`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
    "x-forwarded-for": ALLOWD_IP,
  };
  let { start, liveNo, title } = item;
  title = title
    .replace("/", "")
    .replace("/", "")
    .replace("/", "")
    .replace("/", "")
    .replace("/", "");
  const fileName = `${start}_${liveNo}_${title.trim()}.xlsx`;
  return new Promise((resolve) => {
    axios.get(url, { headers }).then((res) => {
      console.log(`${fileName} downloading...`);
      resolve({
        start,
        liveNo,
        title,
        data: res.data,
      });
    });
  });
};

const writeExcel = (items) => {
  let workBook = undefined;

  let t = [];
  for (const chats of items) {
    workBook = xlsx.utils.book_new();
    t = [];
    const { start, liveNo, title, data } = chats;
    for (const item of data) {
      t.push({
        yyyymmdd: moment(item.created).format("YYYYMMDD"),
        liveNo: item.position,
        custNo: item.custNo,
        nick: item.nick,
        message: item.message,
        datetime: moment(item.created).format("YYYY-MM-DD HH:mm:ss"),
        hide: item.hide,
      });
    }

    const sheetData = xlsx.utils.json_to_sheet(t);
    xlsx.utils.book_append_sheet(workBook, sheetData, "sheet");
    xlsx.writeFile(
      workBook,
      `${process.cwd()}/archive/${start}_${liveNo}_${title.trim()}.xlsx`
    );
  }
};

const app = async () => {
  try {
    console.log("인증을 처리합니다.");
    const { id, pw, startDate, endDate } = await getInfoFile();
    const token = await getToken(id, pw);
    console.log("채팅 데이터를 가져옵니다.");
    const excelList = await getExcelList(token, startDate, endDate);
    !fs.existsSync("archive") && fs.mkdirSync("archive");
    let temp = [];
    console.log("채팅 데이터를 엑셀로 저장합니다.");
    for (const i in excelList) {
      temp.push(downloadExcelFile(token, excelList[i]));
      _sleep(500);
    }
    const result = await Promise.all(temp);
    await writeExcel(result);

    console.log("다운로드 받은 여러 파일을 통합합니다.");
    const path = "./archive";
    const dir = await getDirFile(path);

    var validResult = [];
    var notValidResult = [];
    var validMessage = [];
    var notValidMessage = [];
    var validCustNo = [];
    var notValidCustNo = [];
    var liveNo = 0;
    var date = undefined;
    var hour = undefined;
    dir.map((d, k) => {
      if (d !== ".DS_Store") {
        const data = getReadFile(`${path}/${d}`);
        console.log(k, d);
        if (data.length) {
          validCustNo = [];
          notValidCustNo = [];
          validMessage = [];
          notValidMessage = [];
          liveNo = 0;
          liveNo = data[0].liveNo;
          date = moment(data[0].yyyymmdd).format("YYYY-MM-DD");
          hour = data[10].datetime.substr(11, 2);
          day = Number(data[10].datetime.substr(8, 2));

          data.map((item) => {
            if (item.custNo !== "admin") {
              const isChecked = filterWords.some((word) => {
                return item.message.includes(word);
              });

              if (isChecked) {
                notValidCustNo.push(item.custNo);
                notValidMessage.push(item.message);
              } else {
                validCustNo.push(item.custNo);
                validMessage.push(item.message);
              }
            }
          });

          validResult.push({
            date,
            hour,
            liveNo,
            validCustNo,
            validMessage,
          });
          notValidResult.push({
            date,
            hour,
            liveNo,
            notValidCustNo,
            notValidMessage,
          });
        }
      }
    });

    let vt = [];
    let count = 0;
    validResult.map((item) => {
      count = 0;
      item.validCustNo.map((custNo) => {
        vt.push({
          date: item.date,
          hour: item.hour,
          liveNo: item.liveNo,
          custNo: custNo,
          message: item.validMessage[count++],
        });
      });
    });

    let nvt = [];
    notValidResult.map((item) => {
      count = 0;
      item.notValidCustNo.map((custNo) => {
        nvt.push({
          date: item.date,
          hour: item.hour,
          liveNo: item.liveNo,
          custNo: custNo,
          message: item.notValidMessage[count++],
        });
      });
    });

    let workBook = xlsx.utils.book_new();

    const validSheet = xlsx.utils.json_to_sheet(vt);
    const notValidSheet = xlsx.utils.json_to_sheet(nvt);
    xlsx.utils.book_append_sheet(workBook, validSheet, "유효한 채팅");
    xlsx.utils.book_append_sheet(workBook, notValidSheet, "유효하지 채팅");
    xlsx.writeFile(
      workBook,
      `${process.cwd()}/채팅데이터_${moment().format("YYYYMMDDHHmmss")}.xlsx`
    );
    console.log("파일을 생성하였습니다.");
  } catch (e) {
    console.log(e);
  }
};

app();
