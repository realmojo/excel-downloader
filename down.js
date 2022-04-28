const fs = require("fs");
const axios = require("axios");

const moment = require("moment");
const xlsx = require("xlsx");
const p = require("path");

const CSP_HOST = "https://admin-csp.gsshop.com";
const ALLOWD_IP = "203.247.143.20";

console.log(process.cwd());
// const getToken = async (id, pw) => {
//   const url = `${CSP_HOST}/api/authentication/login`;
//   const data = {
//     id,
//     pw,
//   };
//   return new Promise((resolve) => {
//     axios.post(url, data).then((res) => {
//       resolve(res.data.token);
//     });
//   });
// };

// const getReadFile = () => {
//   return new Promise((resolve) => {
//     fs.readFile("./info.txt", "utf-8", (err, data) => {
//       if (err) {
//         throw new Error("no File");
//       }

//       const [id, pw, startDate, endDate] = data.split("\n");
//       resolve({
//         id,
//         pw,
//         startDate,
//         endDate,
//       });
//     });
//   });
// };

// const fetchExcelList = (token, startDate, endDate) => {
//   const url = `${CSP_HOST}/api/mobilelive/gs/list?start=${startDate}&end=${endDate}`;
//   const headers = {
//     Authorization: `Bearer ${token}`,
//   };
//   return new Promise((resolve) => {
//     axios.get(url, { headers }).then((res) => {
//       resolve(res.data);
//     });
//   });
// };

// const getExcelList = async (token, startDate, endDate) => {
//   const items = await fetchExcelList(token, startDate, endDate);
//   return items.status === "ok" ? items.lives : [];
// };

// const _sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));

// const downloadExcelFile = (token, item) => {
//   const url = `${CSP_HOST}/api/export/${item.liveNo}?toJson=Y`;
//   const headers = {
//     Authorization: `Bearer ${token}`,
//     "Content-Type": "application/json; charset=utf-8",
//     "x-forwarded-for": ALLOWD_IP,
//   };
//   const data = {
//     liveNos: [item.liveNo],
//   };
//   let { start, liveNo, title } = item;
//   title = title.replace("/", "");
//   const fileName = `${start}_${liveNo}_${title.trim()}.xlsx`;
//   return new Promise((resolve) => {
//     axios.get(url, { headers }).then((res) => {
//       console.log(`${fileName} downloading...`);
//       resolve({
//         start,
//         liveNo,
//         title,
//         data: res.data,
//       });
//     });
//   });
// };

// const writeExcel = (items) => {
//   let workBook = undefined;

//   let t = [];
//   for (const chats of items) {
//     workBook = xlsx.utils.book_new();
//     t = [];
//     const { start, liveNo, title, data } = chats;
//     for (const item of data) {
//       t.push({
//         yyyymmdd: moment(item.created).format("YYYYMMDD"),
//         liveNo: item.position,
//         custNo: item.custNo,
//         nick: item.nick,
//         message: item.message,
//         datetime: moment(item.created).format("YYYY-MM-DD HH:mm:ss"),
//         hide: item.hide,
//       });
//     }

//     const sheetData = xlsx.utils.json_to_sheet(t);
//     xlsx.utils.book_append_sheet(workBook, sheetData, "sheet");
//     xlsx.writeFile(
//       workBook,
//       `${p.resolve(__dirname)}/archive/${start}_${liveNo}_${title.trim()}.xlsx`
//     );
//   }
// };

// const start = async () => {
//   const { id, pw, startDate, endDate } = await getReadFile();
//   const token = await getToken(id, pw);
//   const excelList = await getExcelList(token, startDate, endDate);
//   !fs.existsSync("archive") && fs.mkdirSync("archive");
//   let temp = [];
//   for (const i in excelList) {
//     temp.push(downloadExcelFile(token, excelList[i]));
//   }
//   const result = await Promise.all(temp);
//   writeExcel(result);
// };

// start();
