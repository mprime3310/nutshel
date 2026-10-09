// NUTSHELL Assistant workspace. It scans the remembered source page (or a
// pasted task), requests structured answers, and renders tap-to-fill cards.

if (window.top === window.self) document.documentElement.classList.add("standalone");

// Locally embedded activation registry. No token file is loaded or fetched.
const LOCAL_TOKEN_DATA = "TlVUU0hFTEwgbG9jYWwgYWN0aXZhdGlvbiBjb2Rlcwo9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PQpPbmUgbG9jYWxseSBnZW5lcmF0ZWQgY29kZSBwZXIgbGluZS4KCk5VVC1TSEVMTC1MT0NBTC0xMTUxOQpOVVQtU0hFTEwtTE9DQUwtOTU3MzkKTlVULVNIRUxMLUxPQ0FMLTcyMTE3Ck5VVC1TSEVMTC1MT0NBTC01NTEzNApOVVQtU0hFTEwtTE9DQUwtNzE2NjUKTlVULVNIRUxMLUxPQ0FMLTIyNjk2Ck5VVC1TSEVMTC1MT0NBTC05MTIyMApOVVQtU0hFTEwtTE9DQUwtNzU0MTEKTlVULVNIRUxMLUxPQ0FMLTQzODk5Ck5VVC1TSEVMTC1MT0NBTC0zNjY4MgpOVVQtU0hFTEwtTE9DQUwtMzcwNzUKTlVULVNIRUxMLUxPQ0FMLTI0MDQ1Ck5VVC1TSEVMTC1MT0NBTC03NzY1MQpOVVQtU0hFTEwtTE9DQUwtMTcyMDIKTlVULVNIRUxMLUxPQ0FMLTA2OTEyCk5VVC1TSEVMTC1MT0NBTC00MjA3NQpOVVQtU0hFTEwtTE9DQUwtMzAwMDgKTlVULVNIRUxMLUxPQ0FMLTkyMzMzCk5VVC1TSEVMTC1MT0NBTC04MTg3NQpOVVQtU0hFTEwtTE9DQUwtMDkzNDAKTlVULVNIRUxMLUxPQ0FMLTY5ODUzCk5VVC1TSEVMTC1MT0NBTC00ODM5MApOVVQtU0hFTEwtTE9DQUwtNTU2MzgKTlVULVNIRUxMLUxPQ0FMLTg1NDk2Ck5VVC1TSEVMTC1MT0NBTC03NDg1MgpOVVQtU0hFTEwtTE9DQUwtNjMzOTAKTlVULVNIRUxMLUxPQ0FMLTI1NTc1Ck5VVC1TSEVMTC1MT0NBTC05OTEzMQpOVVQtU0hFTEwtTE9DQUwtODI0NDYKTlVULVNIRUxMLUxPQ0FMLTAyMjEzCk5VVC1TSEVMTC1MT0NBTC00NTY4NQpOVVQtU0hFTEwtTE9DQUwtMjExODYKTlVULVNIRUxMLUxPQ0FMLTQ2NDM0Ck5VVC1TSEVMTC1MT0NBTC0yNDAyOApOVVQtU0hFTEwtTE9DQUwtNzY5NzAKTlVULVNIRUxMLUxPQ0FMLTk0NDcwCk5VVC1TSEVMTC1MT0NBTC01NTU2MwpOVVQtU0hFTEwtTE9DQUwtNTkwODUKTlVULVNIRUxMLUxPQ0FMLTU4MjExCk5VVC1TSEVMTC1MT0NBTC0zOTgyNgpOVVQtU0hFTEwtTE9DQUwtMDg5MzkKTlVULVNIRUxMLUxPQ0FMLTgzNDgxCk5VVC1TSEVMTC1MT0NBTC0zNjEzMgpOVVQtU0hFTEwtTE9DQUwtNTI1ODEKTlVULVNIRUxMLUxPQ0FMLTIwMjIxCk5VVC1TSEVMTC1MT0NBTC04NzI4OQpOVVQtU0hFTEwtTE9DQUwtODk0MTYKTlVULVNIRUxMLUxPQ0FMLTQzMjcxCk5VVC1TSEVMTC1MT0NBTC04NTYyMQpOVVQtU0hFTEwtTE9DQUwtMjkwMTgKTlVULVNIRUxMLUxPQ0FMLTU3MTEyCk5VVC1TSEVMTC1MT0NBTC00MjUxNQpOVVQtU0hFTEwtTE9DQUwtNjAxNzcKTlVULVNIRUxMLUxPQ0FMLTcxNjc0Ck5VVC1TSEVMTC1MT0NBTC0yMDY5OQpOVVQtU0hFTEwtTE9DQUwtNjQ1MzYKTlVULVNIRUxMLUxPQ0FMLTczNTI5Ck5VVC1TSEVMTC1MT0NBTC03ODk0OApOVVQtU0hFTEwtTE9DQUwtNjM1NDUKTlVULVNIRUxMLUxPQ0FMLTIwMDU1Ck5VVC1TSEVMTC1MT0NBTC0xOTA1NApOVVQtU0hFTEwtTE9DQUwtMTg0MDYKTlVULVNIRUxMLUxPQ0FMLTIyMDI1Ck5VVC1TSEVMTC1MT0NBTC0xMjg1OApOVVQtU0hFTEwtTE9DQUwtMjIyMjYKTlVULVNIRUxMLUxPQ0FMLTY0NTExCk5VVC1TSEVMTC1MT0NBTC0wMTMyNwpOVVQtU0hFTEwtTE9DQUwtNjg0NzgKTlVULVNIRUxMLUxPQ0FMLTE1NjU5Ck5VVC1TSEVMTC1MT0NBTC01OTA1MwpOVVQtU0hFTEwtTE9DQUwtMTAxNzEKTlVULVNIRUxMLUxPQ0FMLTQ4NDY1Ck5VVC1TSEVMTC1MT0NBTC0yMTY1NgpOVVQtU0hFTEwtTE9DQUwtMDQ5MTkKTlVULVNIRUxMLUxPQ0FMLTQwNDg2Ck5VVC1TSEVMTC1MT0NBTC0yNTUwNQpOVVQtU0hFTEwtTE9DQUwtMzY3NzIKTlVULVNIRUxMLUxPQ0FMLTMzODQ1Ck5VVC1TSEVMTC1MT0NBTC0xMzQ4MgpOVVQtU0hFTEwtTE9DQUwtMjk4NTgKTlVULVNIRUxMLUxPQ0FMLTg2MDAxCk5VVC1TSEVMTC1MT0NBTC03MDQzMQpOVVQtU0hFTEwtTE9DQUwtMDI0NDkKTlVULVNIRUxMLUxPQ0FMLTc2MTEwCk5VVC1TSEVMTC1MT0NBTC02NjYyOQpOVVQtU0hFTEwtTE9DQUwtNTI0OTcKTlVULVNIRUxMLUxPQ0FMLTY4NjgwCk5VVC1TSEVMTC1MT0NBTC05NDIzNgpOVVQtU0hFTEwtTE9DQUwtNTUwOTcKTlVULVNIRUxMLUxPQ0FMLTM4ODkxCk5VVC1TSEVMTC1MT0NBTC04ODc2MQpOVVQtU0hFTEwtTE9DQUwtNTg1ODkKTlVULVNIRUxMLUxPQ0FMLTkwMjg3Ck5VVC1TSEVMTC1MT0NBTC00MDI3NQpOVVQtU0hFTEwtTE9DQUwtMDg0ODcKTlVULVNIRUxMLUxPQ0FMLTE1NzgxCk5VVC1TSEVMTC1MT0NBTC03NTMzNwpOVVQtU0hFTEwtTE9DQUwtOTg2ODYKTlVULVNIRUxMLUxPQ0FMLTI3NDM2Ck5VVC1TSEVMTC1MT0NBTC03MzcyMApOVVQtU0hFTEwtTE9DQUwtNjA1MzcKTlVULVNIRUxMLUxPQ0FMLTkzNzYyCk5VVC1TSEVMTC1MT0NBTC0xOTYzMApOVVQtU0hFTEwtTE9DQUwtMTkxMDYKTlVULVNIRUxMLUxPQ0FMLTYzNTQxCk5VVC1TSEVMTC1MT0NBTC0zNjg2NgpOVVQtU0hFTEwtTE9DQUwtODg3NTMKTlVULVNIRUxMLUxPQ0FMLTA4NTU2Ck5VVC1TSEVMTC1MT0NBTC05NzQzOQpOVVQtU0hFTEwtTE9DQUwtODk5NDYKTlVULVNIRUxMLUxPQ0FMLTQ4ODQ4Ck5VVC1TSEVMTC1MT0NBTC0zNTc4MApOVVQtU0hFTEwtTE9DQUwtOTc5MzgKTlVULVNIRUxMLUxPQ0FMLTU3MDQ0Ck5VVC1TSEVMTC1MT0NBTC0yMzczNApOVVQtU0hFTEwtTE9DQUwtODM1OTMKTlVULVNIRUxMLUxPQ0FMLTQ1NzQ1Ck5VVC1TSEVMTC1MT0NBTC02ODMwOQpOVVQtU0hFTEwtTE9DQUwtNjAzNzEKTlVULVNIRUxMLUxPQ0FMLTEyMDgzCk5VVC1TSEVMTC1MT0NBTC0yMDcxOQpOVVQtU0hFTEwtTE9DQUwtODkwOTkKTlVULVNIRUxMLUxPQ0FMLTIzODk4Ck5VVC1TSEVMTC1MT0NBTC0yNzUzMwpOVVQtU0hFTEwtTE9DQUwtNjc2NDMKTlVULVNIRUxMLUxPQ0FMLTA5MzA3Ck5VVC1TSEVMTC1MT0NBTC04OTAwOApOVVQtU0hFTEwtTE9DQUwtMjE1OTAKTlVULVNIRUxMLUxPQ0FMLTg1MDI3Ck5VVC1TSEVMTC1MT0NBTC0wMDA2NgpOVVQtU0hFTEwtTE9DQUwtMjA2MDMKTlVULVNIRUxMLUxPQ0FMLTY2NDQ0Ck5VVC1TSEVMTC1MT0NBTC00MTE1NwpOVVQtU0hFTEwtTE9DQUwtMzgyNjUKTlVULVNIRUxMLUxPQ0FMLTYxOTAxCk5VVC1TSEVMTC1MT0NBTC0yMTQ5MQpOVVQtU0hFTEwtTE9DQUwtMDg4MzIKTlVULVNIRUxMLUxPQ0FMLTQ4MTI3Ck5VVC1TSEVMTC1MT0NBTC03MDg5OApOVVQtU0hFTEwtTE9DQUwtODU3OTcKTlVULVNIRUxMLUxPQ0FMLTgyMDExCk5VVC1TSEVMTC1MT0NBTC03MDUwNApOVVQtU0hFTEwtTE9DQUwtNjIzNjcKTlVULVNIRUxMLUxPQ0FMLTY0NDg2Ck5VVC1TSEVMTC1MT0NBTC04NjIwMQpOVVQtU0hFTEwtTE9DQUwtODA3NDcKTlVULVNIRUxMLUxPQ0FMLTkwNzg5Ck5VVC1TSEVMTC1MT0NBTC03NjEyMApOVVQtU0hFTEwtTE9DQUwtNDA0MDgKTlVULVNIRUxMLUxPQ0FMLTAwOTk3Ck5VVC1TSEVMTC1MT0NBTC0yNjI2MQpOVVQtU0hFTEwtTE9DQUwtODc2MzYKTlVULVNIRUxMLUxPQ0FMLTYzNTQ5Ck5VVC1TSEVMTC1MT0NBTC01NjI5OQpOVVQtU0hFTEwtTE9DQUwtOTI5OTcKTlVULVNIRUxMLUxPQ0FMLTM3NTk2Ck5VVC1TSEVMTC1MT0NBTC0wMDM0MQpOVVQtU0hFTEwtTE9DQUwtNjE3ODgKTlVULVNIRUxMLUxPQ0FMLTY5OTgzCk5VVC1TSEVMTC1MT0NBTC05ODIxMQpOVVQtU0hFTEwtTE9DQUwtMzU3NDYKTlVULVNIRUxMLUxPQ0FMLTc1ODQxCk5VVC1TSEVMTC1MT0NBTC0xNTc5NApOVVQtU0hFTEwtTE9DQUwtMTI0MTYKTlVULVNIRUxMLUxPQ0FMLTkzNDk3Ck5VVC1TSEVMTC1MT0NBTC01ODgyMgpOVVQtU0hFTEwtTE9DQUwtMzg4MDUKTlVULVNIRUxMLUxPQ0FMLTQxMDU5Ck5VVC1TSEVMTC1MT0NBTC0yNzM5MwpOVVQtU0hFTEwtTE9DQUwtMTUzODAKTlVULVNIRUxMLUxPQ0FMLTEyNzAxCk5VVC1TSEVMTC1MT0NBTC0yMzA1NgpOVVQtU0hFTEwtTE9DQUwtOTMzNTQKTlVULVNIRUxMLUxPQ0FMLTg4NjIzCk5VVC1TSEVMTC1MT0NBTC00NTM4MwpOVVQtU0hFTEwtTE9DQUwtNjk1NDIKTlVULVNIRUxMLUxPQ0FMLTQ3Nzc3Ck5VVC1TSEVMTC1MT0NBTC0yNjAxNgpOVVQtU0hFTEwtTE9DQUwtODA1NTAKTlVULVNIRUxMLUxPQ0FMLTg3NTU1Ck5VVC1TSEVMTC1MT0NBTC0yMjc3MwpOVVQtU0hFTEwtTE9DQUwtMzI2NDgKTlVULVNIRUxMLUxPQ0FMLTUxODM3Ck5VVC1TSEVMTC1MT0NBTC0wNzI5OApOVVQtU0hFTEwtTE9DQUwtMTc5NTcKTlVULVNIRUxMLUxPQ0FMLTU3MTIxCk5VVC1TSEVMTC1MT0NBTC0zNjAxMwpOVVQtU0hFTEwtTE9DQUwtNzAwMTgKTlVULVNIRUxMLUxPQ0FMLTA2NTA3Ck5VVC1TSEVMTC1MT0NBTC00NzAzNwpOVVQtU0hFTEwtTE9DQUwtMzE5NTgKTlVULVNIRUxMLUxPQ0FMLTI5NzYzCk5VVC1TSEVMTC1MT0NBTC04MDY3OQpOVVQtU0hFTEwtTE9DQUwtNDE3NTMKTlVULVNIRUxMLUxPQ0FMLTA1NzU3Ck5VVC1TSEVMTC1MT0NBTC0yODM4NApOVVQtU0hFTEwtTE9DQUwtNzY1MjgKTlVULVNIRUxMLUxPQ0FMLTM2NDM0Ck5VVC1TSEVMTC1MT0NBTC0zOTQ0MApOVVQtU0hFTEwtTE9DQUwtMjg5MzMKTlVULVNIRUxMLUxPQ0FMLTkzMjUyCk5VVC1TSEVMTC1MT0NBTC05MDQxNQpOVVQtU0hFTEwtTE9DQUwtMzAwOTMKTlVULVNIRUxMLUxPQ0FMLTMyNzcwCk5VVC1TSEVMTC1MT0NBTC0zMjgyMQpOVVQtU0hFTEwtTE9DQUwtMjcwODUKTlVULVNIRUxMLUxPQ0FMLTE2Mjg2Ck5VVC1TSEVMTC1MT0NBTC0wNjcyOApOVVQtU0hFTEwtTE9DQUwtMTUxOTQKTlVULVNIRUxMLUxPQ0FMLTcxMDkxCk5VVC1TSEVMTC1MT0NBTC0xMjgwNgpOVVQtU0hFTEwtTE9DQUwtMzQ5NTEKTlVULVNIRUxMLUxPQ0FMLTc4MjE3Ck5VVC1TSEVMTC1MT0NBTC0zNjExOApOVVQtU0hFTEwtTE9DQUwtNzc0NDUKTlVULVNIRUxMLUxPQ0FMLTk5NTk1Ck5VVC1TSEVMTC1MT0NBTC01MTY3NApOVVQtU0hFTEwtTE9DQUwtMzEzNDEKTlVULVNIRUxMLUxPQ0FMLTE4ODc0Ck5VVC1TSEVMTC1MT0NBTC04MDQyNQpOVVQtU0hFTEwtTE9DQUwtNTczMjEKTlVULVNIRUxMLUxPQ0FMLTA5NTQ0Ck5VVC1TSEVMTC1MT0NBTC04MzAwNwpOVVQtU0hFTEwtTE9DQUwtODcxMTUKTlVULVNIRUxMLUxPQ0FMLTQ2MzAwCk5VVC1TSEVMTC1MT0NBTC04ODU1NwpOVVQtU0hFTEwtTE9DQUwtMDkzMDUKTlVULVNIRUxMLUxPQ0FMLTYyOTE4Ck5VVC1TSEVMTC1MT0NBTC0xNjk5MQpOVVQtU0hFTEwtTE9DQUwtMzI4ODQKTlVULVNIRUxMLUxPQ0FMLTIwMTQ1Ck5VVC1TSEVMTC1MT0NBTC03OTA1MgpOVVQtU0hFTEwtTE9DQUwtNjIzMDEKTlVULVNIRUxMLUxPQ0FMLTE2NjQzCk5VVC1TSEVMTC1MT0NBTC03NDYxNgpOVVQtU0hFTEwtTE9DQUwtMDgxMTUKTlVULVNIRUxMLUxPQ0FMLTc2NjY0Ck5VVC1TSEVMTC1MT0NBTC05MDE2MQpOVVQtU0hFTEwtTE9DQUwtNTA2MjQKTlVULVNIRUxMLUxPQ0FMLTE3MjQwCk5VVC1TSEVMTC1MT0NBTC0zMTcwNApOVVQtU0hFTEwtTE9DQUwtOTkyNTkKTlVULVNIRUxMLUxPQ0FMLTI1Njg2Ck5VVC1TSEVMTC1MT0NBTC01MzIyNQpOVVQtU0hFTEwtTE9DQUwtNTAzMjcKTlVULVNIRUxMLUxPQ0FMLTM5MjgxCk5VVC1TSEVMTC1MT0NBTC0wNzgxNQpOVVQtU0hFTEwtTE9DQUwtMDE3NTkKTlVULVNIRUxMLUxPQ0FMLTYwOTUzCk5VVC1TSEVMTC1MT0NBTC02OTAyOApOVVQtU0hFTEwtTE9DQUwtODE5OTIKTlVULVNIRUxMLUxPQ0FMLTg3OTU0Ck5VVC1TSEVMTC1MT0NBTC01NjA0NwpOVVQtU0hFTEwtTE9DQUwtMTU4MjAKTlVULVNIRUxMLUxPQ0FMLTc3ODg2Ck5VVC1TSEVMTC1MT0NBTC0zMDY3MwpOVVQtU0hFTEwtTE9DQUwtNzg3ODMKTlVULVNIRUxMLUxPQ0FMLTcyMzc2Ck5VVC1TSEVMTC1MT0NBTC00NjIyOApOVVQtU0hFTEwtTE9DQUwtMjY3NjEKTlVULVNIRUxMLUxPQ0FMLTk1ODk4Ck5VVC1TSEVMTC1MT0NBTC02NDU4NgpOVVQtU0hFTEwtTE9DQUwtMzIzMTYKTlVULVNIRUxMLUxPQ0FMLTI2MzIzCk5VVC1TSEVMTC1MT0NBTC0xOTU2MApOVVQtU0hFTEwtTE9DQUwtMTMwNTIKTlVULVNIRUxMLUxPQ0FMLTMxNDA2Ck5VVC1TSEVMTC1MT0NBTC0wNDcxMwpOVVQtU0hFTEwtTE9DQUwtNjMyMjYKTlVULVNIRUxMLUxPQ0FMLTA2Mjg2Ck5VVC1TSEVMTC1MT0NBTC0yMjQyNwpOVVQtU0hFTEwtTE9DQUwtMTM4NDMKTlVULVNIRUxMLUxPQ0FMLTI1NzE5Ck5VVC1TSEVMTC1MT0NBTC02MzYyMQpOVVQtU0hFTEwtTE9DQUwtNDU0NzMKTlVULVNIRUxMLUxPQ0FMLTYxOTkwCk5VVC1TSEVMTC1MT0NBTC0xMjc2NwpOVVQtU0hFTEwtTE9DQUwtMjE2MDkKTlVULVNIRUxMLUxPQ0FMLTAzMjkzCk5VVC1TSEVMTC1MT0NBTC05NjU4NwpOVVQtU0hFTEwtTE9DQUwtMDY4ODIKTlVULVNIRUxMLUxPQ0FMLTUxNDAzCk5VVC1TSEVMTC1MT0NBTC03ODQyNQpOVVQtU0hFTEwtTE9DQUwtOTI2NjUKTlVULVNIRUxMLUxPQ0FMLTEyNjAwCk5VVC1TSEVMTC1MT0NBTC0zOTI5OApOVVQtU0hFTEwtTE9DQUwtMzE3MDkKTlVULVNIRUxMLUxPQ0FMLTUzODM2Ck5VVC1TSEVMTC1MT0NBTC01MDkzNApOVVQtU0hFTEwtTE9DQUwtOTMxNDEKTlVULVNIRUxMLUxPQ0FMLTEwMjEzCk5VVC1TSEVMTC1MT0NBTC04MDgwOApOVVQtU0hFTEwtTE9DQUwtOTY2MzgKTlVULVNIRUxMLUxPQ0FMLTc2MzEyCk5VVC1TSEVMTC1MT0NBTC0xOTg2OQpOVVQtU0hFTEwtTE9DQUwtMDQ5NTMKTlVULVNIRUxMLUxPQ0FMLTk4MjUxCk5VVC1TSEVMTC1MT0NBTC05MTYxNwpOVVQtU0hFTEwtTE9DQUwtODk0OTIKTlVULVNIRUxMLUxPQ0FMLTE4OTQ1Cg==";
const LOCAL_LICENSE_TOKENS = new Set(
  (atob(LOCAL_TOKEN_DATA).match(/^NUT-SHELL-LOCAL-[0-9]{5}$/gm) || []).map((code) => code.toUpperCase()),
);

function isLocalLicenseToken(value) {
  return LOCAL_LICENSE_TOKENS.has(String(value || "").trim().toUpperCase());
}

const $ = (id) => document.getElementById(id);
const input = $("input");
const loader = $("loader");
const result = $("result");
const cardsEl = $("cards");
const errorEl = $("error");
const statusEl = $("status");
const previewEl = $("preview");
const previewList = $("preview-list");
const nextStepEl = $("nextstep");
const gateEl = $("gate");

let items = [];

/* ================================================================
   LICENSE GATE — 5 free scans, then a bundled local token to continue.
   Token verification happens inside this extension and never calls the server.
   ================================================================ */
const FREE_SCANS = Number.MAX_SAFE_INTEGER; // trial limit removed — unlimited use
const MIN_AUTOFILL_CONFIDENCE = 0.85;
let activated = false;
let scanCount = 0;
let installId = "";

async function getState() {
  const store = await chrome.storage.local.get(["activated", "activationToken", "scanCount", "installId"]);
  activated = !!store.activated && typeof isLocalLicenseToken === "function" && isLocalLicenseToken(store.activationToken);
  scanCount = Number(store.scanCount) || 0;
  installId = String(store.installId || "");
  if (store.activated && !activated) await chrome.storage.local.set({ activated: false });
  if (!installId) {
    installId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await chrome.storage.local.set({ installId });
  }
  return { activated, scanCount, installId };
}

async function persistState() {
  await chrome.storage.local.set({ activated, scanCount, installId });
}

function showGate(remaining) {
  hideGate();
  return;
}

function hideGate() {
  gateEl.classList.remove("checking", "activating");
  gateEl.classList.add("hidden");
}

function renderActivationStatus() {
  const button = $("activation-status");
  if (!button) return;
  button.textContent = "UNLIMITED";
  button.classList.add("is-active");
  button.disabled = true;
  button.title = "Unlimited use — no trial limit";
}

async function openActivationGate() {
  await getState();
  renderActivationStatus();
  if (activated) return;
  showGate(Math.max(0, FREE_SCANS - scanCount));
  setTimeout(() => $("token")?.focus(), 0);
}

// The extension is deliberately the verifier. The bundled registry is loaded
// before this script (tokens.js), so activation works offline and independently
// of the AI server.
async function redeemToken(token) {
  await getState();
  const normalized = String(token || "").trim().toUpperCase();
  if (typeof isLocalLicenseToken !== "function" || !isLocalLicenseToken(normalized)) {
    throw new Error("That local token is not recognized by this extension.");
  }
  await chrome.storage.local.set({
    activationToken: normalized,
    activationVerifiedAt: Date.now(),
  });
  return { ok: true, activated: true, local: true };
}

// Called before any scan. Trial limit removed — always allowed.
async function authorizeScan() {
  return true;
}

// Trial limit removed — follow-ups and autofill are always allowed.
async function requireTokenIfSpent() {
  return true;
}
let context = null;
let previewRows = [];
let activeProfile = "standard";
let recognition = null;
let listening = false;
let answerStyle = "detailed";
let voiceBuffer = "";
let voiceSendTimer = null;

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.classList.remove("hidden");
}
function clearError() {
  errorEl.classList.add("hidden");
  statusEl.classList.add("hidden");
}
function showStatus(msg) {
  statusEl.textContent = msg;
  statusEl.classList.remove("hidden");
}
function loaderNote(msg) {
  const p = loader?.querySelector("p");
  if (p) p.textContent = msg;
}

/* ---------- target tab ---------- */
async function targetTab() {
  // Prefer the currently selected website tab. The side panel is an extension
  // page, not a tab, so this always points at the page beside NUTSHELL.
  const tabs = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const active = tabs.find((tab) => /^https?:/i.test(tab.url || ""));
  if (active?.id) {
    void chrome.runtime.sendMessage({ type: "set-source-tab", tabId: active.id }).catch(() => null);
    return { id: active.id, url: active.url, title: active.title };
  }
  const pinned = await chrome.runtime.sendMessage({ type: "get-source-tab" }).catch(() => null);
  return pinned?.tab?.id ? pinned.tab : null;
}

async function runOnPage(func, args = [], tab = null) {
  tab ||= await targetTab();
  if (!tab?.id) throw new Error("No page to work with — open a website tab beside NUTSHELL first.");
  // chrome.scripting.executeScript needs a real array; callers sometimes pass
  // a single value (e.g. a string id). Normalise so the injected page function
  // always receives the arguments it expects.
  const list = Array.isArray(args) ? args : [args];
  const [res] = await chrome.scripting.executeScript({ target: { tabId: tab.id }, args: list, func });
  return res?.result;
}

/* ================================================================
   PAGE SCAN — reads text + a typed inventory of every answerable field.
   ================================================================ */
function scanPageForContext({ includeText = true, includeMedia = true } = {}) {
  const clean = (s) => (s || "").replace(/\s+/g, " ").trim();
  const labelFor = (el) => {
    const bits = [
      el.labels?.[0]?.innerText,
      el.getAttribute("aria-label"),
      el.getAttribute("aria-labelledby") ? document.getElementById(el.getAttribute("aria-labelledby"))?.innerText : "",
      el.placeholder,
      el.closest("label")?.innerText,
      el.name,
      el.id,
    ];
    let label = clean(bits.filter(Boolean).join(" · ")).slice(0, 220);
    if (!label) label = clean(el.closest("li,fieldset,section,article,div,tr")?.innerText || "").slice(0, 220);
    return label;
  };
  const questionFor = (el) => clean(el.closest("fieldset,li,tr,section,article,div")?.innerText || "").slice(0, 600);
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const st = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && st.visibility !== "hidden" && st.display !== "none";
  };

  document.querySelectorAll("[data-nutshell-field]").forEach((el) => el.removeAttribute("data-nutshell-field"));

  const nodes = [...document.querySelectorAll("input,textarea,select,[contenteditable='true'],[role='radio'],[role='checkbox']")]
    .filter((el) => {
      if (el.disabled || el.readOnly) return false;
      const t = (el.type || "").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "file"].includes(t)) return false;
      return visible(el);
    });

  const fields = [];
  const groups = new Map();
  let n = 0;

  nodes.forEach((el) => {
    const id = `sf${++n}`;
    el.setAttribute("data-nutshell-field", id);
    const tag = el.tagName.toLowerCase();
    const t = (el.type || el.getAttribute("role") || "").toLowerCase();
    let kind = "text";
    let options;
    if (tag === "select") {
      kind = el.multiple ? "multi-select" : "select";
      options = [...el.options].map((o) => clean(o.textContent)).filter(Boolean).slice(0, 40);
    } else if (t === "radio") kind = "choice";
    else if (t === "checkbox") kind = "checkbox";
    else if (t === "number" || t === "range") kind = "number";
    else if (t === "date" || t === "datetime-local" || t === "month" || t === "time") kind = "date";
    else if (t === "email") kind = "email";
    else if (t === "url") kind = "url";
    else if (tag === "textarea" || el.isContentEditable) kind = "long-text";

    const field = {
      id, kind,
      label: labelFor(el),
      question: questionFor(el),
      name: el.name || "",
      group: el.name || "",
      filled: !!(el.value || el.checked || (el.isContentEditable && el.textContent?.trim())),
      min: el.min || undefined,
      max: el.max || undefined,
      required: !!el.required,
      options,
    };

    if ((kind === "choice" || kind === "checkbox") && el.name) {
      const key = `${kind}:${el.name}`;
      if (!groups.has(key)) {
        const g = { ...field, kind: kind === "choice" ? "single-choice-group" : "multi-choice-group", options: [], members: [] };
        groups.set(key, g);
        fields.push(g);
      }
      const g = groups.get(key);
      g.options.push(clean(el.labels?.[0]?.innerText || el.getAttribute("aria-label") || el.value || el.closest("label")?.innerText || ""));
      g.members.push({ id, option: clean(el.labels?.[0]?.innerText || el.getAttribute("aria-label") || el.value || "") });
    } else {
      fields.push(field);
    }
  });

  // innerText already excludes script/style content. Prefer the page's main
  // content and avoid cloning the entire DOM, which was the biggest local
  // source of delay on large pages.
  const contentRoot = document.querySelector("main,[role='main'],article") || document.body;
  const pageText = includeText ? (contentRoot?.innerText || "").replace(/\n{3,}/g, "\n\n").trim() : "";
  const selection = window.getSelection()?.toString() || "";
  const media = includeMedia ? [
    ...[...document.images].slice(0, 24).map((img) => ({
      type: "image",
      alt: clean(img.alt || img.getAttribute("aria-label") || img.closest("figure")?.innerText || ""),
    })),
    ...[...document.querySelectorAll("video")].slice(0, 12).map((video) => ({
      type: "video",
      alt: clean(video.getAttribute("aria-label") || video.title || video.closest("figure,article,section,div")?.innerText || "").slice(0, 900),
      duration: Number.isFinite(video.duration) ? Math.round(video.duration) : 0,
      captions: [...video.textTracks].flatMap((track) => [...(track.cues || [])].slice(0, 40).map((cue) => cue.text)).join(" ").slice(0, 5000),
    })),
  ] : [];

  return {
    text: selection ? selection : pageText.slice(0, 22000),
    selection: selection.slice(0, 4000),
    fields,
    media,
    heading: clean(document.querySelector("h1,h2")?.innerText || document.title),
  };
}

function contextSummary(ctx) {
  if (!ctx) return "";
  const lines = ctx.fields.map((f) => {
    const opts = f.options?.length ? ` | options: ${f.options.join(" / ")}` : "";
    return `[${f.id}] (${f.kind}${f.required ? ", required" : ""}) ${f.label || (f.question || "").slice(0, 120)}${opts}`;
  });
  const fieldSummary = lines.length ? `\n\nANSWERABLE FIELDS ON THIS PAGE:\n${lines.join("\n")}` : "";
  const mediaSummary = ctx.media?.length ? `\n\nMEDIA INVENTORY:\n${ctx.media.map((m) => `[${m.type}] ${m.alt || "untitled"}${m.captions ? `\nCaptions: ${m.captions}` : ""}`).join("\n")}` : "";
  return fieldSummary + mediaSummary;
}

let contextSource = null;
async function refreshContext(tab = null, options = {}) {
  context = await runOnPage(scanPageForContext, [options], tab);
  contextSource = tab ? { id: tab.id, url: tab.url } : null;
  return context;
}

/* ---------- solve: straight to the AI provider you configured (ai.js) ---------- */
async function solve(payload) {
  const data = await NutshellAI.solve(payload);
  if (data.switchedFrom) {
    showStatus(`"${data.switchedFrom}" isn't available on your key, so NUTSHELL switched to ${data.model} and saved it.`);
    NutshellAI.loadConfig().then((cfg) => { aiCfg = cfg; if ($("settings").classList.contains("hidden")) showAIProvider(aiCfg.primary); });
  }
  if (Array.isArray(data.items) && data.items.length) return { ...data, items: normalizeAnswerItems(data.items) };
  if (data.answer) {
    const answer = cleanDisplayText(data.answer);
    return { ...data, items: [{ question: "Result", answer, fill: answer }] };
  }
  throw new Error("NUTSHELL couldn't find an answer in that content.");
}

async function flashCopy(btn, text) {
  await navigator.clipboard.writeText(text || "");
  btn.textContent = "✓ Copied";
  btn.classList.add("done");
  setTimeout(() => {
    btn.textContent = "⧉ Copy";
    btn.classList.remove("done");
  }, 1400);
}

function plainText(list) {
  return list.map((i) => `Q: ${i.question || ""}\nA: ${i.answer || ""}${i.fill && i.fill !== i.answer ? `\nFill: ${i.fill}` : ""}${i.why ? `\nWhy: ${i.why}` : ""}`).join("\n\n");
}

function confidenceOf(item) {
  const c = Number(item?.confidence);
  return Number.isFinite(c) ? Math.max(0, Math.min(1, c)) : 0.6;
}

function normalizedText(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function cleanDisplayText(value) {
  return String(value ?? "")
    .replace(/```(?:[a-z0-9_+-]+)?\s*/gi, "")
    .replace(/```|`/g, "")
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/^\s*[*+]\s+/gm, "")
    .replace(/^\s*-\s+/gm, "")
    .replace(/\*\*/g, "")
    .replace(/__/g, "")
    .replace(/~~/g, "")
    .replace(/\*/g, "×")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function choiceIndexFor(item, options) {
  const declared = String(item.correctOption || "").trim().toLowerCase().match(/^([a-d])$/)?.[1];
  if (declared) return "abcd".indexOf(declared);
  for (const candidate of [item.fill, item.answer]) {
    const value = cleanDisplayText(candidate);
    const letter = value.match(/^([a-d])(?:[).,:\- ]|$)/i)?.[1]?.toLowerCase();
    if (letter) return "abcd".indexOf(letter);
    const comparable = normalizedText(value);
    const exact = options.findIndex((option) => normalizedText(option) === comparable);
    if (exact >= 0) return exact;
  }
  return -1;
}

function normalizeAnswerItems(list) {
  return (Array.isArray(list) ? list : []).map((raw) => {
    const item = { ...raw };
    item.question = cleanDisplayText(item.question);
    item.answer = cleanDisplayText(item.answer);
    item.why = cleanDisplayText(item.why);
    item.label = cleanDisplayText(item.label);
    item.needsPage = cleanDisplayText(item.needsPage);
    item.fill = cleanDisplayText(item.fill);
    item.options = Array.isArray(item.options) ? item.options.map(cleanDisplayText).filter(Boolean).slice(0, 4) : [];

    if (item.options.length >= 2 && (item.kind === "option" || item.kind === "multi-option" || item.correctOption || item.fill || item.answer)) {
      const index = choiceIndexFor(item, item.options);
      if (index >= 0 && index < item.options.length) {
        const letter = String.fromCharCode(97 + index);
        const selected = item.options[index];
        const selectedLabel = `${letter}) ${selected}`;
        const explanation = item.answer.replace(/^\s*[a-d](?:[).,:\- ]+)\s*/i, "").trim();
        item.answer = explanation && normalizedText(explanation) !== normalizedText(selected)
          ? `${selectedLabel}. ${explanation}`
          : selectedLabel;
        item.correctOption = letter;
        item.fill = selected;
        item.why = `Selected answer: ${selectedLabel}.${item.why ? ` ${item.why}` : ""}`;
      } else {
        item.correctOption = "";
      }
    }
    return item;
  });
}

function mcqDetails(item) {
  let options = Array.isArray(item.options) ? item.options.filter(Boolean).slice(0, 4) : [];
  if (!options.length && context?.fields?.length) {
    const field = context.fields.find((f) => f.id === item.fieldId || (item.label && normalizedText(f.label) === normalizedText(item.label)));
    if (field?.kind === "single-choice-group" && Array.isArray(field.options)) options = field.options.slice(0, 4);
  }
  const isChoice = item.kind === "option" || item.kind === "multi-option" || options.length >= 2;
  if (!isChoice || options.length < 2) return null;
  const index = "abcd".indexOf(String(item.correctOption || "").trim().toLowerCase());
  return { options, index: index >= 0 && index < options.length ? index : -1 };
}

function render(list) {
  cardsEl.innerHTML = "";
  const fragment = document.createDocumentFragment();
  list.forEach((item, idx) => {
    const card = document.createElement("div");
    card.className = "qa";
    card.tabIndex = 0;
    card.title = "Tap to select this answer for autofill";
    card.style.animationDelay = `${idx * 60}ms`;

    const q = document.createElement("div");
    q.className = "qa-q";
    q.textContent = item.question || "Task";
    if (item.kind) {
      const chip = document.createElement("span");
      chip.className = "qa-kind";
      chip.textContent = item.kind;
      q.appendChild(chip);
    }
    const conf = confidenceOf(item);
    const cChip = document.createElement("span");
    cChip.className = conf >= 0.75 ? "qa-conf high" : "qa-conf low";
    cChip.textContent = `${Math.round(conf * 100)}% sure`;
    q.appendChild(cChip);
    card.appendChild(q);

    const meter = document.createElement("div");
    meter.className = "qa-meter";
    const bar = document.createElement("i");
    bar.style.width = `${Math.round(conf * 100)}%`;
    meter.appendChild(bar);
    card.appendChild(meter);

    const a = document.createElement("div");
    a.className = "qa-a";
    a.textContent = item.answer || "";
    card.appendChild(a);

    const mcq = mcqDetails(item);
    if (mcq) {
      const choices = document.createElement("div");
      choices.className = "mcq";
      mcq.options.forEach((option, optionIndex) => {
        const choice = document.createElement("div");
        choice.className = `mcq-option${optionIndex === mcq.index ? " correct" : ""}`;
        const letter = document.createElement("b");
        letter.textContent = String.fromCharCode(65 + optionIndex);
        const text = document.createElement("span");
        text.textContent = option;
        choice.append(letter, text);
        choices.appendChild(choice);
      });
      const label = document.createElement("div");
      label.className = "mcq-answer";
      label.textContent = mcq.index >= 0
        ? `Selected answer: ${String.fromCharCode(65 + mcq.index)}) ${mcq.options[mcq.index]}`
        : "No option selected";
      choices.appendChild(label);
      card.appendChild(choices);
    }

    if (item.fill && item.fill !== item.answer) {
      const f = document.createElement("div");
      f.className = "qa-fill";
      f.textContent = `To enter: ${item.fill}`;
      card.appendChild(f);
    }

    if (item.why) {
      const w = document.createElement("div");
      w.className = "qa-why";
      w.textContent = `Why: ${item.why}`;
      card.appendChild(w);
    }

    const foot = document.createElement("div");
    foot.className = "qa-foot";
    const btn = document.createElement("button");
    btn.className = "qa-copy";
    btn.textContent = "⧉ Copy";
    btn.addEventListener("click", () => void flashCopy(btn, item.answer || ""));
    foot.appendChild(btn);
    if (item.fill || item.answer) {
      const pick = document.createElement("button");
      pick.className = "qa-pick";
      pick.textContent = "🎯 Pick field";
      pick.title = "Click the field on the page where this answer should go";
      pick.addEventListener("click", (event) => {
        event.stopPropagation();
        void runPickFlow([item]);
      });
      foot.appendChild(pick);
    }
    if (item.fill) {
      const fill = document.createElement("button");
      fill.className = "qa-fill-btn";
      fill.textContent = "✧ Autofill";
      fill.addEventListener("click", (event) => {
        event.stopPropagation();
        void runDryRun([item]);
      });
      foot.appendChild(fill);
    }
    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      card.classList.toggle("selected");
    });
    card.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") { event.preventDefault(); card.classList.toggle("selected"); }
    });
    card.appendChild(foot);

    fragment.appendChild(card);
  });
  cardsEl.appendChild(fragment);
  result.classList.remove("hidden");
}

function renderNextStep(data) {
  if (!nextStepEl) return;
  const lines = [];
  if (data?.nextStep) lines.push(`Next: ${data.nextStep}`);
  if (data?.comparedWith) lines.push(`Compared with: ${data.comparedWith}`);
  if (!lines.length) {
    nextStepEl.classList.add("hidden");
    nextStepEl.textContent = "";
    return;
  }
  nextStepEl.textContent = lines.join("  ·  ");
  nextStepEl.classList.remove("hidden");
}

async function runAnalysis(profile = "standard") {
  clearError();
  if (!(await authorizeScan())) return;
  activeProfile = profile;
  previewEl.classList.add("hidden");
  const btn = $("analyze");
  btn.disabled = true;
  loaderNote(profile === "ultra" ? "Ultra Scan is checking every clue…" : profile === "media" ? "NUTSHELL is indexing image and video context…" : "NUTSHELL is mapping the task…");
  result.classList.add("hidden");
  loader.classList.remove("hidden");
  try {
    const typedText = input.value.trim();
    const tab = await targetTab().catch(() => null);
    // A pasted task still gets a lightweight field scan so Autofill keeps
    // working, but the fast path skips the expensive page-text/media passes.
    const ctx = await refreshContext(tab, {
      includeText: !typedText || profile === "ultra",
      includeMedia: profile === "media" || profile === "ultra",
    }).catch(() => null);
    let text = typedText;
    if (!text) text = ctx?.selection || ctx?.text || "";
    if (!text && !ctx?.fields?.length) throw new Error("Add a question or scan the page first.");

    const data = await solve({
      text,
      url: tab?.url || "",
      title: tab?.title || ctx?.heading || "",
      fields: ctx?.fields || [],
      media: ctx?.media || [],
      profile,
      history: [],
      lessons: [],
    });

    items = data.items;
    render(items);
    renderNextStep(data);
    showStatus(`${profile === "ultra" ? "Ultra Scan " : ""}found ${items.length} answer${items.length === 1 ? "" : "s"}${ctx?.fields?.length ? ` across ${ctx.fields.length} target fields.` : "."}`);
  } catch (e) {
    showError(e.message);
    if (/Add an API key/.test(e.message)) openSettings();
  } finally {
    loader.classList.add("hidden");
    btn.disabled = false;
  }
}

/* ---------- autofill: dry run then apply ---------- */
function dryRunOnPage(payload) {
  const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const score = (a, b) => {
    const A = new Set(norm(a).split(" ").filter((w) => w.length > 3));
    const B = new Set(norm(b).split(" ").filter((w) => w.length > 3));
    if (!A.size || !B.size) return 0;
    let hit = 0;
    A.forEach((w) => B.has(w) && hit++);
    return hit / Math.max(A.size, 1);
  };
  const labelFor = (el) => [
    el.labels?.[0]?.innerText,
    el.getAttribute("aria-label"),
    el.placeholder,
    el.name,
    el.id,
    el.closest("label")?.innerText,
    el.closest("li,fieldset,section,tr,div")?.innerText?.slice(0, 300),
  ].filter(Boolean).join(" ");
  const visible = (el) => {
    const r = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && style.display !== "none" && style.visibility !== "hidden";
  };
  const safeConfidence = (item) => {
    const value = Number(item?.confidence);
    return Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.6;
  };
  const matchChoice = (candidates, value) => {
    const cleanValue = norm(value);
    const letter = cleanValue.match(/^([abcd])(?: |$)/)?.[1];
    if (letter && candidates["abcd".indexOf(letter)]) return candidates["abcd".indexOf(letter)];
    return candidates.find((candidate) => {
      const text = norm(`${labelFor(candidate)} ${candidate.value || ""}`);
      return cleanValue && text && (text === cleanValue || text.includes(cleanValue) || cleanValue.includes(text));
    }) || null;
  };

  document.querySelectorAll("[data-nutshell-fill]").forEach((el) => el.removeAttribute("data-nutshell-fill"));

  const fields = [...document.querySelectorAll("input,textarea,select,[contenteditable='true'],[role='radio'],[role='checkbox']")]
    .filter((el) => {
      if (el.disabled || el.readOnly) return false;
      const t = (el.type || "").toLowerCase();
      if (["hidden", "submit", "button", "reset", "image", "file"].includes(t)) return false;
      return visible(el);
    });

  const used = new Set();
  const rows = [];
  let seq = 0;

  const claim = (el, item, value) => {
    if (used.has(el)) return;
    used.add(el);
    const id = `sfill${++seq}`;
    el.setAttribute("data-nutshell-fill", id);
    rows.push({
      id,
      label: (item.label || item.question || "").trim().slice(0, 160) || labelFor(el).slice(0, 160) || "Field",
      value,
      confidence: safeConfidence(item),
      type: (el.type || el.getAttribute("role") || el.tagName || "").toLowerCase(),
    });
  };

  for (const item of payload) {
    const value = String(item.fill ?? item.answer ?? "").trim();
    if (!value) continue;
    const key = `${item.label || ""} ${item.question || ""}`;
    if (item.fieldId) {
      let direct = document.querySelector(`[data-nutshell-field="${item.fieldId}"]`);
      const type = (direct?.type || direct?.getAttribute("role") || "").toLowerCase();
      if (direct && (type === "radio" || type === "checkbox")) {
        const selector = type === "radio" ? "input[type='radio'],[role='radio']" : "input[type='checkbox'],[role='checkbox']";
        const group = direct.name ? [...document.querySelectorAll(selector)].filter((candidate) => candidate.name === direct.name) : [direct];
        direct = matchChoice(group, value) || direct;
      }
      if (direct && !used.has(direct) && visible(direct)) { claim(direct, item, value); continue; }
    }
    const target = fields.filter((el) => !used.has(el)).map((el) => ({ el, s: score(labelFor(el), key) })).sort((a, b) => b.s - a.s)[0];
    if (target && target.s > 0.25) { claim(target.el, item, value); continue; }
    if (payload.length === 1) {
      const empty = fields.find((el) => !used.has(el) && !el.value);
      if (empty) claim(empty, item, value);
    }
  }
  return { rows };
}

async function applyFillOnPage(plan, delayMs = 0) {
  const norm = (s) => String(s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const labelFor = (el) => [el.labels?.[0]?.innerText, el.getAttribute("aria-label"), el.value, el.closest("label")?.innerText, el.closest("fieldset,li,div")?.innerText?.slice(0, 250)].filter(Boolean).join(" ");
  const emit = (el) => {
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.dispatchEvent(new Event("blur", { bubbles: true }));
  };
  const optionFor = (options, value) => {
    const next = norm(value);
    const letter = String(value || "").trim().toLowerCase().match(/^([a-d])(?:[).,: -]|$)/)?.[1];
    if (letter && options["abcd".indexOf(letter)]) return options["abcd".indexOf(letter)];
    return options.find((option) => {
      const text = norm(`${option.textContent || ""} ${option.value || ""}`);
      return next && text && (text === next || text.includes(next) || next.includes(text));
    }) || null;
  };
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const nativeSet = (el, value) => {
    if (el.tagName !== "INPUT" && el.tagName !== "TEXTAREA") { el.textContent = value; return; }
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement : HTMLInputElement;
    const setter = Object.getOwnPropertyDescriptor(proto.prototype, "value")?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
  };
  const readValue = (el) => (el.isContentEditable ? el.textContent : el.value);

  // Input types where real keystrokes make sense. Numbers only when they are plain digits.
  const TYPEABLE = new Set(["text", "search", "email", "url", "tel", "password", ""]);
  const canType = (el, text) => {
    if (!delayMs) return false;
    if (el.isContentEditable || el.tagName === "TEXTAREA") return true;
    if (el.tagName !== "INPUT") return false;
    const t = (el.type || "").toLowerCase();
    return TYPEABLE.has(t) || (t === "number" && /^\d+$/.test(text));
  };

  // One keystroke: keydown -> keypress -> text insert (+ input event) -> keyup.
  const typeChar = (el, ch) => {
    const key = ch === "\n" ? "Enter" : ch;
    if (!el.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true }))) return;
    el.dispatchEvent(new KeyboardEvent("keypress", { key, bubbles: true, cancelable: true }));
    const before = readValue(el);
    let inserted = false;
    try { inserted = document.execCommand("insertText", false, ch); } catch { inserted = false; }
    if (!inserted || readValue(el) === before) {
      if (el.isContentEditable) el.textContent = before + ch;
      else nativeSet(el, before + ch);
      el.dispatchEvent(new InputEvent("input", { data: ch, inputType: "insertText", bubbles: true }));
    }
    el.dispatchEvent(new KeyboardEvent("keyup", { key, bubbles: true }));
  };

  const typeInto = async (el, text) => {
    el.focus();
    if (readValue(el)) {
      if (el.isContentEditable) document.execCommand?.("selectAll");
      else el.select?.();
      let cleared = false;
      try { cleared = document.execCommand("delete"); } catch { cleared = false; }
      if (!cleared || readValue(el)) {
        if (el.isContentEditable) el.textContent = "";
        else nativeSet(el, "");
        el.dispatchEvent(new InputEvent("input", { inputType: "deleteContentBackward", bubbles: true }));
      }
    }
    const singleLine = el.tagName === "INPUT";
    const chars = [...(singleLine ? text.replace(/\s*\n+\s*/g, " ") : text)];
    // Steady rhythm at exactly the speed the user picked (Stop button cancels).
    const step = delayMs;
    for (const ch of chars) {
      if (window.__nutshellStopFill) return false;
      typeChar(el, ch);
      if (step > 0) await sleep(step);
    }
    el.dispatchEvent(new Event("change", { bubbles: true }));
    el.blur?.();
    return true;
  };

  window.__nutshellStopFill = false;
  let filled = 0;
  const failed = [];
  for (const row of plan) {
    if (window.__nutshellStopFill) { failed.push(row.label); continue; }
    const el = document.querySelector(`[data-nutshell-fill="${row.id}"]`);
    if (!el) continue;
    el.scrollIntoView?.({ block: "center" });
    const next = String(row.value ?? "");
    const type = (el.type || el.getAttribute("role") || "").toLowerCase();
    if (type === "radio" || type === "checkbox") {
      const selector = type === "radio" ? "input[type='radio'],[role='radio']" : "input[type='checkbox'],[role='checkbox']";
      const candidates = el.name ? [...document.querySelectorAll(selector)].filter((candidate) => candidate.name === el.name) : [el];
      const pseudoOptions = candidates.map((candidate) => ({ textContent: labelFor(candidate), value: candidate.value || "", element: candidate }));
      const chosen = optionFor(pseudoOptions, next)?.element || el;
      if (chosen.getAttribute("role") === "radio" || chosen.getAttribute("role") === "checkbox") {
        chosen.click();
        if (type === "checkbox") chosen.setAttribute("aria-checked", /^(false|no|0|unchecked)$/i.test(next) ? "false" : "true");
      } else if (type === "radio") {
        chosen.checked = true;
        chosen.click();
      } else {
        chosen.checked = !/^(false|no|0|unchecked)$/i.test(next);
      }
      emit(chosen);
      const verified = chosen.getAttribute("role") ? chosen.getAttribute("aria-checked") === "true" : chosen.checked;
      if (verified) filled++;
      else failed.push(row.label);
      if (delayMs) await sleep(150);
      continue;
    }
    if (el.tagName === "SELECT") {
      const option = optionFor([...el.options], next);
      if (!option) { failed.push(row.label); continue; }
      if (el.multiple) {
        const values = next.split(/[,;|]/).map(norm).filter(Boolean);
        [...el.options].forEach((candidate) => { candidate.selected = values.some((value) => norm(candidate.textContent).includes(value) || value.includes(norm(candidate.value))); });
      } else el.value = option.value;
      emit(el);
    } else if (canType(el, next)) {
      await typeInto(el, next);
    } else if (el.isContentEditable) {
      el.focus();
      el.textContent = next;
      emit(el);
    } else {
      el.focus();
      nativeSet(el, next);
      emit(el);
    }
    const actual = readValue(el);
    const expected = el.tagName === "INPUT" ? next.replace(/\s*\n+\s*/g, " ") : next;
    if (String(actual ?? "") === next || String(actual ?? "") === expected || (el.tagName === "SELECT" && String(actual ?? ""))) filled++;
    else failed.push(row.label);
    if (delayMs) await sleep(150);
  }
  return { filled, failed, stopped: !!window.__nutshellStopFill };
}


/* ================================================================
   WHERE TO FILL: click-to-pick, numbered markers, locate
   These run inside the page. They only draw overlays and tag the
   chosen element; nothing is typed until you confirm the preview.
   ================================================================ */
function pickFieldOnPage(pickId, hint) {
  return new Promise((resolve) => {
    document.getElementById("nutshell-picker")?.remove();
    const PANEL = "nutshell-floating-sidebar";
    const SEL = "input,textarea,select,[contenteditable]:not([contenteditable='false']),[role='radio'],[role='checkbox'],[role='textbox']";
    const SKIP = ["hidden", "submit", "button", "reset", "image", "file"];
    const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();
    const labelFor = (el) => clean([
      el.labels?.[0]?.innerText, el.getAttribute("aria-label"), el.placeholder, el.name,
      el.closest("label")?.innerText, el.closest("li,fieldset,section,tr,div")?.innerText?.slice(0, 120),
    ].filter(Boolean).join(" · ")).slice(0, 160);
    const usable = (el, viaLabel) => {
      if (!el || el.disabled || el.readOnly) return false;
      if (SKIP.includes((el.type || "").toLowerCase())) return false;
      if (viaLabel) return true;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const targetFrom = (node) => {
      if (!(node instanceof Element) || node.closest("#" + PANEL) || node.closest("#nutshell-picker")) return null;
      const direct = node.closest(SEL);
      if (usable(direct, false)) return direct;
      const control = node.closest("label")?.control;
      return usable(control, true) ? control : null;
    };

    const root = document.createElement("div");
    root.id = "nutshell-picker";
    Object.assign(root.style, { position: "fixed", inset: "0", zIndex: "2147483646", pointerEvents: "none" });
    const box = document.createElement("div");
    Object.assign(box.style, {
      position: "fixed", display: "none", border: "2px solid #b88cff", borderRadius: "6px",
      background: "rgba(20,12,34,.55)", boxShadow: "none", transition: "all .05s linear",
    });
    const tip = document.createElement("div");
    const defaultTip = hint || "NUTSHELL · click the field where this should go · Esc to cancel";
    tip.textContent = defaultTip;
    Object.assign(tip.style, {
      position: "fixed", left: "50%", top: "12px", transform: "translateX(-50%)", maxWidth: "70vw", padding: "8px 14px",
      font: "12px ui-monospace,Consolas,monospace", color: "#e9ddff", background: "#0e0a18", border: "1px solid #5b3f9e",
      borderRadius: "10px", boxShadow: "none", textAlign: "center",
    });
    root.append(box, tip);
    document.documentElement.appendChild(root);

    const inPanel = (e) => !!e.target?.closest?.("#" + PANEL);
    const move = (e) => {
      if (inPanel(e)) { box.style.display = "none"; return; }
      const el = targetFrom(e.target);
      if (!el) { box.style.display = "none"; return; }
      const r = (el.getBoundingClientRect().width ? el : (el.labels?.[0] || el.parentElement || el)).getBoundingClientRect();
      Object.assign(box.style, { display: "block", left: r.left - 3 + "px", top: r.top - 3 + "px", width: r.width + 6 + "px", height: r.height + 6 + "px" });
    };
    const swallow = (e) => {
      if (inPanel(e)) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.();
    };
    const click = (e) => {
      if (inPanel(e)) return;
      swallow(e);
      const el = targetFrom(e.target);
      if (!el) { tip.textContent = "That isn't a fillable field. Click a text box, dropdown or option · Esc to cancel"; return; }
      document.querySelectorAll(`[data-nutshell-fill="${pickId}"]`).forEach((n) => n.removeAttribute("data-nutshell-fill"));
      el.setAttribute("data-nutshell-fill", pickId);
      done({ ok: true, id: pickId, label: labelFor(el), type: (el.type || el.getAttribute("role") || el.tagName || "").toLowerCase() });
    };
    const key = (e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); done({ cancelled: true }); } };
    const cancel = () => done({ cancelled: true });
    const swallowEvents = ["mousedown", "mouseup", "pointerdown", "pointerup", "dblclick", "contextmenu"];
    function done(result) {
      document.removeEventListener("mousemove", move, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("keydown", key, true);
      swallowEvents.forEach((t) => document.removeEventListener(t, swallow, true));
      window.removeEventListener("nutshell-pick-cancel", cancel);
      root.remove();
      resolve(result);
    }
    document.addEventListener("mousemove", move, true);
    document.addEventListener("click", click, true);
    document.addEventListener("keydown", key, true);
    swallowEvents.forEach((t) => document.addEventListener(t, swallow, true));
    window.addEventListener("nutshell-pick-cancel", cancel);
  });
}

function cancelPickOnPage() {
  window.dispatchEvent(new Event("nutshell-pick-cancel"));
}

function showTargetsOnPage(list) {
  const LAYER = "nutshell-targets";
  window.__nutshellTargetsCleanup?.();
  document.getElementById(LAYER)?.remove();
  const layer = document.createElement("div");
  layer.id = LAYER;
  Object.assign(layer.style, { position: "fixed", inset: "0", zIndex: "2147483645", pointerEvents: "none" });
  const items = [];
  for (const entry of list || []) {
    const el = document.querySelector(`[data-nutshell-fill="${entry.id}"]`);
    if (!el) continue;
    const outline = document.createElement("div");
    Object.assign(outline.style, {
      position: "fixed", border: "2px solid #5b3f9e", borderRadius: "6px", background: "rgba(20,12,34,.5)",
      boxShadow: "none",
    });
    const badge = document.createElement("div");
    badge.textContent = String(entry.n);
    Object.assign(badge.style, {
      position: "absolute", left: "-12px", top: "-12px", minWidth: "22px", height: "22px", padding: "0 5px", boxSizing: "border-box",
      borderRadius: "11px", background: "#1c1033", color: "#e9ddff", font: "700 12px/22px ui-monospace,Consolas,monospace",
      textAlign: "center", boxShadow: "none", border: "1px solid #5b3f9e",
    });
    outline.appendChild(badge);
    layer.appendChild(outline);
    items.push({ el, outline });
  }
  const place = () => {
    for (const { el, outline } of items) {
      let r = el.getBoundingClientRect();
      if (!r.width || !r.height) r = (el.labels?.[0] || el.parentElement || el).getBoundingClientRect();
      Object.assign(outline.style, { left: r.left - 3 + "px", top: r.top - 3 + "px", width: r.width + 6 + "px", height: r.height + 6 + "px", display: r.width || r.height ? "block" : "none" });
    }
  };
  place();
  document.documentElement.appendChild(layer);
  window.addEventListener("scroll", place, true);
  window.addEventListener("resize", place);
  window.__nutshellTargetsCleanup = () => {
    window.removeEventListener("scroll", place, true);
    window.removeEventListener("resize", place);
    document.getElementById(LAYER)?.remove();
    window.__nutshellTargetsCleanup = null;
  };
  return items.length;
}

function clearTargetsOnPage() {
  window.__nutshellTargetsCleanup?.();
  document.getElementById("nutshell-targets")?.remove();
}

function locateTargetOnPage(id) {
  const el = document.querySelector(`[data-nutshell-fill="${id}"]`);
  if (!el) return false;
  el.scrollIntoView({ block: "center", behavior: "smooth" });
  setTimeout(() => {
    let r = el.getBoundingClientRect();
    if (!r.width || !r.height) r = (el.labels?.[0] || el.parentElement || el).getBoundingClientRect();
    const pulse = document.createElement("div");
    Object.assign(pulse.style, {
      position: "fixed", left: r.left - 4 + "px", top: r.top - 4 + "px", width: r.width + 8 + "px", height: r.height + 8 + "px",
      border: "2px solid #b88cff", borderRadius: "8px", boxShadow: "none", zIndex: "2147483646", pointerEvents: "none",
    });
    document.documentElement.appendChild(pulse);
    pulse.animate([{ opacity: 1, transform: "scale(1)" }, { opacity: 0, transform: "scale(1.18)" }], { duration: 700, iterations: 3 });
    setTimeout(() => pulse.remove(), 2200);
  }, 350);
  return true;
}


function syncRowChecks() {
  previewList.querySelectorAll("input[type=checkbox]").forEach((box) => {
    const row = previewRows.find((r) => r.id === box.dataset.id);
    if (row) row.checked = box.checked;
  });
}

function refreshTargetMarkers() {
  const checked = new Set([...previewList.querySelectorAll("input[type=checkbox]:checked")].map((b) => b.dataset.id));
  const list = previewRows.map((row, i) => ({ id: row.id, n: i + 1 })).filter((x) => checked.has(x.id));
  return runOnPage(showTargetsOnPage, [list]).catch(() => null);
}

function clearTargetMarkers() {
  return runOnPage(clearTargetsOnPage, []).catch(() => null);
}

function renderPreview(rows) {
  previewList.innerHTML = "";
  const fragment = document.createDocumentFragment();
  rows.forEach((row, idx) => {
    const line = document.createElement("label");
    line.className = "preview-row";
    line.style.animationDelay = `${idx * 45}ms`;
    const num = document.createElement("span");
    num.className = "preview-num";
    num.textContent = String(idx + 1);
    num.title = "Matches the numbered marker on the page";
    const box = document.createElement("input");
    box.type = "checkbox";
    const requiresReview = row.confidence < MIN_AUTOFILL_CONFIDENCE && !row.picked;
    box.checked = typeof row.checked === "boolean" ? row.checked : !requiresReview;
    box.dataset.id = row.id;
    const body = document.createElement("div");
    body.className = "preview-body";
    const label = document.createElement("div");
    label.className = "preview-label";
    label.textContent = row.label;
    const value = document.createElement("div");
    value.className = "preview-value";
    value.textContent = row.picked
      ? `${row.value} (your pick)`
      : requiresReview
        ? `${row.value} — review required (${Math.round(row.confidence * 100)}% sure)`
        : `${row.value} (${Math.round(row.confidence * 100)}% sure)`;
    const actions = document.createElement("div");
    actions.className = "preview-actions";
    const locate = document.createElement("button");
    locate.type = "button";
    locate.className = "row-btn";
    locate.textContent = "⌖ Show on page";
    locate.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      void runOnPage(locateTargetOnPage, [row.id]).then((ok) => { if (!ok) showError("That field is no longer on the page."); }).catch(() => null);
    });
    const change = document.createElement("button");
    change.type = "button";
    change.className = "row-btn";
    change.textContent = "🎯 Change field";
    change.addEventListener("click", (event) => {
      event.preventDefault(); event.stopPropagation();
      void repickRow(row);
    });
    actions.append(locate, change);
    body.append(label, value, actions);
    line.append(num, box, body);
    fragment.appendChild(line);
  });
  previewList.appendChild(fragment);
  previewEl.classList.remove("hidden");
  updateFillEstimate();
  void refreshTargetMarkers();
}

/* ---------- choose where each answer goes ---------- */
let pickSeq = 0;
function setPicking(on, text = "") {
  $("pick-bar").classList.toggle("hidden", !on);
  $("pick-text").textContent = text;
}

// Ask the user to click a field on the page. Resolves to {id,label,type} or null if cancelled.
async function pickOne(hintText, progress = "") {
  const id = `sfill_pick${++pickSeq}`;
  const short = String(hintText || "this answer").replace(/\s+/g, " ").slice(0, 70);
  setPicking(true, `${progress ? progress + " · " : ""}Click the field on the page for: "${short}"`);
  try {
    const res = await runOnPage(pickFieldOnPage, [id, `NUTSHELL · click where "${short}" should go · Esc to cancel`]);
    return res && res.ok ? res : null;
  } finally {
    setPicking(false);
  }
}

async function runPickFlow(list) {
  clearError();
  const usable = list.filter((item) => String(item.fill ?? item.answer ?? "").trim());
  if (!usable.length) return showError("There's no answer text to fill yet.");
  previewEl.classList.add("hidden");
  await clearTargetMarkers();
  const rows = [];
  try {
    for (let i = 0; i < usable.length; i++) {
      const item = usable[i];
      const res = await pickOne(item.label || item.question || item.answer, usable.length > 1 ? `${i + 1}/${usable.length}` : "");
      if (!res) break;
      rows.push({
        id: res.id,
        label: (item.label || item.question || res.label || "Field").trim().slice(0, 160),
        value: String(item.fill ?? item.answer ?? "").trim(),
        confidence: confidenceOf(item),
        type: res.type,
        picked: true,
      });
    }
  } catch (e) {
    showError(e?.message || "Can't pick a field on this page. Try a normal website tab.");
  }
  if (!rows.length) return showStatus("Nothing picked, so nothing will be filled.");
  previewRows = rows;
  renderPreview(previewRows);
  showStatus("Check the numbered markers on the page, then hit Fill approved.");
}

async function repickRow(row) {
  clearError();
  syncRowChecks();
  const res = await pickOne(row.label || row.value).catch(() => null);
  if (!res) return void refreshTargetMarkers();
  row.id = res.id;
  row.type = res.type;
  row.picked = true;
  if (!row.label || row.label === "Field") row.label = res.label;
  renderPreview(previewRows);
}

async function runDryRun(candidateItems = items) {
  clearError();
  if (!candidateItems.length) return showError("Analyze a task first, then autofill.");
  try {
    const chosen = candidateItems === items
      ? [...cardsEl.querySelectorAll(".qa.selected")].map((card) => items[[...cardsEl.children].indexOf(card)]).filter(Boolean)
      : candidateItems;
    if (fillWhere === "choose") return void (await runPickFlow(chosen.length ? chosen : candidateItems));
    const res = await runOnPage(dryRunOnPage, [chosen.length ? chosen : candidateItems]);
    previewRows = res?.rows || [];
    if (!previewRows.length) return showError("Couldn't match any input on the page — copy the answers instead.");
    renderPreview(previewRows);
    const reviewCount = previewRows.filter((row) => row.confidence < MIN_AUTOFILL_CONFIDENCE).length;
    if (reviewCount) showStatus(`${reviewCount} field${reviewCount === 1 ? " needs" : "s need"} review and ${reviewCount === 1 ? "is" : "are"} unchecked by default.`);
  } catch {
    showError("Can't read this page's form. Try a normal website tab.");
  }
}

/* ---------- follow-up ---------- */
let turns = [];
function renderThread() {
  const threadEl = $("thread");
  if (!threadEl) return;
  threadEl.innerHTML = "";
  if (!turns.length) { threadEl.classList.add("hidden"); return; }
  threadEl.classList.remove("hidden");
  const fragment = document.createDocumentFragment();
  turns.forEach((t, idx) => {
    const row = document.createElement("div");
    row.className = t.role === "user" ? "turn turn-user" : "turn turn-ai";
    row.style.animationDelay = `${Math.min(idx, 6) * 40}ms`;
    const who = document.createElement("div");
    who.className = "turn-who";
    who.textContent = t.role === "user" ? "You" : "NUTSHELL";
    row.appendChild(who);
    const body = document.createElement("div");
    if (t.pending) {
      body.className = "turn-typing";
      body.innerHTML = "<span></span><span></span><span></span>";
    } else {
      body.textContent = t.text;
    }
    row.appendChild(body);
    if (t.role === "ai" && !t.pending && t.text) {
      const copy = document.createElement("button");
      copy.className = "turn-copy";
      copy.textContent = "⧉ Copy";
      copy.addEventListener("click", () => void flashCopy(copy, t.text));
      row.appendChild(copy);
    }
    fragment.appendChild(row);
  });
  threadEl.appendChild(fragment);
  threadEl.scrollTop = threadEl.scrollHeight;
}

async function askFollowUp() {
  clearError();
  if (!(await requireTokenIfSpent())) return;
  const question = ($("followup").value || "").trim();
  if (!question) return showError("Type a follow-up question first.");
  const askBtn = $("ask");
  askBtn.disabled = true;
  $("followup").value = "";
  turns.push({ role: "user", text: question, at: Date.now() });
  turns.push({ role: "ai", text: "", at: Date.now(), pending: true });
  renderThread();
  try {
    const tab = await targetTab().catch(() => null);
    const contextIsCurrent = context && (!contextSource || !tab || (contextSource.id === tab.id && contextSource.url === tab.url));
    const ctx = contextIsCurrent ? context : (await refreshContext(tab, { includeText: true, includeMedia: true }).catch(() => null));
    const priorItems = items.map((i) => ({ question: (i.question || "").slice(0, 300), answer: (i.answer || "").slice(0, 700), fill: (i.fill || "").slice(0, 300) }));
    const conversation = turns.filter((t) => !t.pending).slice(-12).map((t) => ({ role: t.role === "user" ? "user" : "assistant", text: (t.text || "").slice(0, 1500) }));
    const data = await solve({
      mode: "followup",
      text: `FOLLOW-UP QUESTION FROM THE USER ABOUT THIS PAGE:\n${question}\n\nReturn a single item whose "question" is the follow-up and whose "answer" is the reply.`,
      url: tab?.url || "",
      title: tab?.title || ctx?.heading || "",
      fields: ctx?.fields || [],
      media: ctx?.media || [],
      answerStyle,
      history: [],
      lessons: [],
      priorItems,
      conversation,
    });
    const answer = (data.items || []).map((i) => i.answer || i.fill || "").filter(Boolean).join("\n\n").trim() || "No answer came back — try rewording the question.";
    turns = turns.filter((t) => !t.pending);
    turns.push({ role: "ai", text: answer, at: Date.now() });
    renderThread();
  } catch (e) {
    turns = turns.filter((t) => !t.pending);
    renderThread();
    showError(e.message);
    if (/Add an API key/.test(e.message)) openSettings();
  } finally {
    askBtn.disabled = false;
  }
}

function setListening(next) {
  listening = next;
  const button = $("listen");
  button.textContent = next ? "■ Stop listening" : "◉ Start listening";
  button.classList.toggle("is-listening", next);
}

function questionDetected(text) {
  const phrase = String(text || "").trim();
  return /\?\s*$/.test(phrase) || /^(what|why|how|when|where|who|which|can you|could you|would you|will you|do you|does|is|are|should|tell me|explain|describe|give me)\b/i.test(phrase);
}

function cancelVoiceSend() {
  if (voiceSendTimer) clearTimeout(voiceSendTimer);
  voiceSendTimer = null;
}

function stopListening() {
  cancelVoiceSend();
  setListening(false);
  recognition?.stop();
}

function queueVoiceQuestion() {
  cancelVoiceSend();
  voiceSendTimer = setTimeout(() => {
    voiceSendTimer = null;
    const question = ($("followup").value || "").trim();
    if (!listening || !questionDetected(question) || $("ask").disabled) return;
    stopListening();
    showStatus("Question heard — sending it to NUTSHELL…");
    void askFollowUp();
    voiceBuffer = "";
  }, 900);
}

function toggleListening() {
  if (listening) { stopListening(); return; }
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return showError("Live listening needs Chrome's speech recognition. You can still ask in the chat.");
  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";
  voiceBuffer = ($("followup").value || "").trim();
  recognition.onstart = () => { setListening(true); showStatus("Listening — ask a question and NUTSHELL will send it automatically."); };
  recognition.onresult = (event) => {
    let interim = "";
    let finalChunk = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript.trim();
      if (event.results[i].isFinal) finalChunk += `${text} `;
      else interim += text;
    }
    if (finalChunk) {
      voiceBuffer = `${voiceBuffer} ${finalChunk}`.trim();
      $("followup").value = voiceBuffer;
      showStatus(`Heard: ${voiceBuffer}`);
      if (questionDetected(voiceBuffer)) queueVoiceQuestion();
    } else if (interim) {
      const preview = `${voiceBuffer} ${interim}`.trim();
      $("followup").value = preview;
      showStatus(`Listening: ${preview}`);
    }
  };
  recognition.onerror = (event) => {
    if (event.error !== "aborted") showError("Listening stopped. Check microphone permission, then try again.");
    setListening(false);
  };
  recognition.onend = () => {
    recognition = null;
    if (listening) {
      setListening(false);
      showStatus("Listening paused. Tap Start listening to continue.");
    }
  };
  recognition.start();
}

/* ---------- wiring ---------- */
if ($("activate")) $("activate").addEventListener("click", activateWithToken);
if ($("activation-status")) $("activation-status").addEventListener("click", () => {});
if ($("token")) $("token").addEventListener("keydown", (e) => {
  if (e.key === "Enter") activateWithToken();
});
async function activateWithToken() {
  const note = $("token-note");
  const btn = $("activate");
  const token = $("token").value.trim();
  note.className = "token-note";
  if (!/^NUT-/i.test(token)) {
    note.textContent = "Enter the full NUT-… local code.";
    return;
  }
  btn.disabled = true;
  $("token").disabled = true;
  gateEl.classList.add("checking");
  btn.classList.add("checking");
  try {
    await redeemToken(token);
    activated = true;
    await persistState();
    gateEl.classList.remove("checking");
    btn.classList.remove("checking");
    gateEl.classList.add("activating");
    btn.classList.add("success");
    btn.querySelector(".cta-label").textContent = "Activating…";
    note.textContent = "Local code verified in this extension. Activating NUTSHELL…";
    btn.querySelector(".cta-label").textContent = "Activated ✓";
    note.textContent = "Activated — opening your workspace…";
    hideGate();
    renderActivationStatus();
    $("token").value = "";
    note.textContent = "";
    showStatus("Activated — welcome to unlimited NUTSHELL. ✦");
  } catch (e) {
    gateEl.classList.remove("checking", "activating");
    btn.classList.remove("checking", "success");
    note.className = "token-note";
    note.textContent = e.message;
  } finally {
    btn.disabled = false;
    $("token").disabled = false;
    btn.classList.remove("checking", "success");
    btn.querySelector(".cta-label").textContent = "Activate";
  }
}

function openSettings() {
  const modal = $("settings");
  modal.classList.remove("hidden");
  modal.setAttribute("aria-hidden", "false");
  setTimeout(() => $("ai-key")?.focus(), 30);
}
function closeSettings() {
  const modal = $("settings");
  modal.classList.add("hidden");
  modal.setAttribute("aria-hidden", "true");
}
$("settings-toggle").addEventListener("click", () => (($("settings").classList.contains("hidden")) ? openSettings() : closeSettings()));
$("settings-close").addEventListener("click", closeSettings);
$("settings").addEventListener("click", (event) => { if (event.target === $("settings")) closeSettings(); });
document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !$("settings").classList.contains("hidden")) closeSettings(); });

/* ---------- AI provider settings ---------- */
let aiCfg = null;
let aiShown = null;

function aiNote(msg, cls = "") {
  const note = $("ai-note");
  note.textContent = msg;
  note.className = "api-note" + (cls ? " " + cls : "");
}

// Copy whatever is typed in the form into the in-memory config for the provider on screen.
function readAIForm() {
  if (!aiCfg || !aiShown) return;
  aiCfg.providers[aiShown] = {
    apiKey: $("ai-key").value.trim(),
    model: $("ai-model").value.trim(),
    base: PROVIDER_DEFS()[aiShown].editBase ? $("ai-base").value.trim() : "",
  };
  aiCfg.fallback = $("ai-fallback").checked;
}

const PROVIDER_DEFS = () => NutshellAI.PROVIDERS;

function showAIProvider(id) {
  const def = PROVIDER_DEFS()[id];
  const saved = aiCfg.providers[id] || {};
  aiShown = id;
  $("ai-provider").value = id;
  $("ai-key").value = saved.apiKey || "";
  $("ai-key").placeholder = def.needsKey ? "Paste your API key" : "Optional";
  $("ai-model").value = saved.model || "";
  $("ai-model").placeholder = def.model || "model name";
  $("ai-base-wrap").classList.toggle("hidden", !def.editBase);
  $("ai-base").value = saved.base || "";
  $("ai-base").placeholder = def.base || "https://host/v1";
  const link = $("ai-keylink");
  link.classList.toggle("hidden", !def.keyHelp);
  link.href = def.keyHelp || "#";
  link.textContent = def.needsKey ? "Get a free key →" : "Learn more →";
  $("ai-fallback").checked = aiCfg.fallback !== false;
}

async function initAISettings() {
  aiCfg = await NutshellAI.loadConfig();
  const select = $("ai-provider");
  select.innerHTML = "";
  Object.entries(PROVIDER_DEFS()).forEach(([id, def]) => {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = def.label;
    select.appendChild(opt);
  });
  showAIProvider(aiCfg.primary);
}

$("ai-provider").addEventListener("change", () => {
  readAIForm();
  aiCfg.primary = $("ai-provider").value;
  showAIProvider(aiCfg.primary);
  aiNote("");
});

$("ai-listmodels").addEventListener("click", async () => {
  readAIForm();
  const id = $("ai-provider").value;
  aiNote("Asking the provider which models your key can use…");
  try {
    const { ids, suggested, current } = await NutshellAI.listModels(id, aiCfg.providers[id]);
    const list = $("ai-models");
    list.innerHTML = "";
    ids.forEach((m) => { const o = document.createElement("option"); o.value = m; list.appendChild(o); });
    if (!ids.length) return aiNote("The provider returned no usable chat models for this key.", "bad");
    if (!ids.includes(current)) {
      $("ai-model").value = suggested;
      aiNote(`${ids.length} models found. "${current}" isn't one of them, so I picked ${suggested}. Hit Save.`, "ok");
    } else {
      aiNote(`${ids.length} models found. Click the Model box to pick a different one.`, "ok");
    }
  } catch (e) {
    aiNote(e.message, "bad");
  }
});

$("ai-save").addEventListener("click", async () => {
  readAIForm();
  aiCfg.primary = $("ai-provider").value;
  await NutshellAI.saveConfig(aiCfg);
  const ok = NutshellAI.hasProvider(aiCfg);
  aiNote(ok ? "Saved. Keys stay in this browser and are only sent to the provider you picked." : "Saved, but this provider still needs a key (or URL).", ok ? "ok" : "bad");
  $("boot-copy").textContent = ok ? "NUTSHELL is set." : "Add an API key in ⚙ to get started";
  if (ok) setTimeout(closeSettings, 700);
});

$("ai-test").addEventListener("click", async () => {
  clearError();
  readAIForm();
  const id = $("ai-provider").value;
  aiNote("Testing…");
  try {
    const out = await NutshellAI.testProvider(id, aiCfg.providers[id]);
    aiCfg.primary = id;
    if (out.switchedFrom) {
      aiCfg.providers[id] = { ...(aiCfg.providers[id] || {}), model: out.model };
      $("ai-model").value = out.model;
    }
    await NutshellAI.saveConfig(aiCfg);
    aiNote(out.switchedFrom ? `Connected ✓. "${out.switchedFrom}" isn't available on your key, so I switched to ${out.model}.` : `Connected ✓ (${out.model})`, "ok");
  } catch (e) {
    aiNote(e.message, "bad");
  }
});

$("scan").addEventListener("click", async () => {
  clearError();
  try {
    const ctx = await refreshContext(await targetTab().catch(() => null), { includeText: true, includeMedia: false });
    if (!ctx?.text) return showError("Nothing readable found on this page.");
    input.value = ctx.text;
    showStatus(`Scanned this page: ${ctx.fields.length} answerable target${ctx.fields.length === 1 ? "" : "s"}.`);
  } catch {
    showError("Can't read this page. Try a normal website tab.");
  }
});

$("ultra-scan").addEventListener("click", () => void runAnalysis("ultra"));
$("media-scan").addEventListener("click", () => void runAnalysis("media"));

$("selection").addEventListener("click", async () => {
  clearError();
  try {
    const ctx = await refreshContext(await targetTab().catch(() => null), { includeText: false, includeMedia: false });
    if (!ctx?.selection) return showError("Select some text on the page first.");
    input.value = ctx.selection;
  } catch {
    showError("Can't read the selection on this page.");
  }
});

$("clear").addEventListener("click", () => {
  input.value = "";
  items = [];
  previewRows = [];
  cardsEl.innerHTML = "";
  result.classList.add("hidden");
  previewEl.classList.add("hidden");
  clearError();
  void clearTargetMarkers();
});

$("analyze").addEventListener("click", () => void runAnalysis("standard"));
$("copy").addEventListener("click", async () => {
  const btn = $("copy");
  await flashCopy(btn, plainText(items));
  setTimeout(() => { btn.textContent = "⧉ Copy all"; }, 2400);
});
$("autofill").addEventListener("click", () => void runDryRun());
$("preview-toggle").addEventListener("click", () => {
  const boxes = [...previewList.querySelectorAll("input[type=checkbox]")];
  const next = !boxes.every((b) => b.checked);
  boxes.forEach((b) => (b.checked = next));
  syncRowChecks();
  updateFillEstimate();
  void refreshTargetMarkers();
});
$("preview-cancel").addEventListener("click", () => {
  previewEl.classList.add("hidden");
  previewRows = [];
  void clearTargetMarkers();
});
$("pick-cancel").addEventListener("click", () => void runOnPage(cancelPickOnPage, []).catch(() => null));

// Fill target: let NUTSHELL guess the field, or click each field yourself.
let fillWhere = "auto";
function paintWhere() {
  document.querySelectorAll(".where-chip").forEach((c) => c.classList.toggle("on", c.dataset.where === fillWhere));
}
document.querySelectorAll(".where-chip").forEach((chip) => chip.addEventListener("click", async () => {
  fillWhere = chip.dataset.where === "choose" ? "choose" : "auto";
  paintWhere();
  await chrome.storage.local.set({ fillWhere });
  showStatus(fillWhere === "choose" ? "You'll click the target field on the page for each answer." : "NUTSHELL will guess the fields and mark them with numbers before filling.");
}));
// Typing speed: slider is logarithmic 0..100 -> 10..600 WPM (5 characters per word).
const WPM_MIN = 10, WPM_MAX = 600;
let fillWpm = 120;
let fillInstant = false;
let typing = false;
const posToWpm = (pos) => {
  const v = WPM_MIN * Math.pow(WPM_MAX / WPM_MIN, Math.min(Math.max(pos, 0), 100) / 100);
  return v < 60 ? Math.round(v) : Math.round(v / 5) * 5;
};
const wpmToPos = (wpm) => Math.round((100 * Math.log(wpm / WPM_MIN)) / Math.log(WPM_MAX / WPM_MIN));
const delayFromWpm = (wpm) => Math.max(8, Math.round(12000 / wpm)); // ms per character
const currentDelay = () => (fillInstant ? 0 : delayFromWpm(fillWpm));

function updateFillEstimate() {
  const wpm = $("fill-wpm");
  $("fill-wpm-val").textContent = fillInstant ? "INSTANT" : `${fillWpm} WPM`;
  wpm.disabled = fillInstant;
  document.querySelectorAll(".chip").forEach((c) => c.classList.toggle("on", !fillInstant && Number(c.dataset.wpm) === fillWpm));
  const note = $("fill-est");
  if (fillInstant) { note.textContent = "Values are set all at once."; return; }
  const checked = new Set([...previewList.querySelectorAll("input[type=checkbox]:checked")].map((b) => b.dataset.id));
  const chars = (previewRows || []).filter((r) => checked.has(r.id)).reduce((n, r) => n + String(r.value ?? "").length, 0);
  const secs = Math.round((chars * delayFromWpm(fillWpm)) / 1000);
  const when = secs >= 60 ? `${Math.floor(secs / 60)} min ${secs % 60} s` : `${secs} s`;
  note.textContent = chars ? `≈ ${when} for ${chars} characters · ${delayFromWpm(fillWpm)} ms per key` : `${delayFromWpm(fillWpm)} ms per key`;
}
async function saveFillPrefs() {
  await chrome.storage.local.set({ fillWpm, fillInstant });
}
$("fill-wpm").addEventListener("input", () => { fillWpm = posToWpm(Number($("fill-wpm").value)); updateFillEstimate(); });
$("fill-wpm").addEventListener("change", saveFillPrefs);
document.querySelectorAll(".chip").forEach((chip) => chip.addEventListener("click", () => {
  fillInstant = false; $("fill-instant").checked = false;
  fillWpm = Number(chip.dataset.wpm); $("fill-wpm").value = wpmToPos(fillWpm);
  updateFillEstimate(); saveFillPrefs();
}));
$("fill-instant").addEventListener("change", () => { fillInstant = $("fill-instant").checked; updateFillEstimate(); saveFillPrefs(); });
previewList.addEventListener("change", () => { syncRowChecks(); updateFillEstimate(); void refreshTargetMarkers(); });

$("preview-confirm").addEventListener("click", async () => {
  const confirmBtn = $("preview-confirm");
  if (typing) {
    // Second click while typing = stop.
    await runOnPage(() => { window.__nutshellStopFill = true; }, []).catch(() => null);
    return;
  }
  clearError();
  const approved = [...previewList.querySelectorAll("input[type=checkbox]")].filter((b) => b.checked).map((b) => b.dataset.id);
  const plan = previewRows.filter((r) => approved.includes(r.id));
  if (!plan.length) return showError("Approve at least one field first.");
  const delay = currentDelay();
  typing = true;
  const idleLabel = confirmBtn.textContent;
  if (delay) {
    confirmBtn.textContent = "■ Stop typing";
    showStatus("Typing into the page…");
  }
  try {
    const res = await runOnPage(applyFillOnPage, [plan, delay]);
    previewEl.classList.add("hidden");
    const failed = Array.isArray(res?.failed) ? res.failed : [];
    showStatus(
      res?.stopped
        ? `Stopped. Filled ${res?.filled || 0} field${res?.filled === 1 ? "" : "s"} before you stopped it.`
        : failed.length
          ? `Filled ${res?.filled || 0} field${res?.filled === 1 ? "" : "s"}. ${failed.length} field${failed.length === 1 ? " needs" : "s need"} a manual check.`
          : `Filled ${res?.filled || 0} approved field${res?.filled === 1 ? "" : "s"}.`,
    );
  } catch {
    showError("Can't write to this page. Try a normal website tab.");
  } finally {
    typing = false;
    confirmBtn.textContent = idleLabel;
    void clearTargetMarkers();
  }
});
$("ask").addEventListener("click", () => {
  if (listening) stopListening();
  voiceBuffer = "";
  void askFollowUp();
});
$("listen").addEventListener("click", toggleListening);
document.querySelectorAll(".style-choice").forEach((button) => {
  button.addEventListener("click", async () => {
    answerStyle = button.dataset.answerStyle || "detailed";
    document.querySelectorAll(".style-choice").forEach((choice) => {
      choice.classList.toggle("selected", choice === button);
    });
    await chrome.storage.local.set({ answerStyle });
  });
});
$("followup").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
    if (listening) stopListening();
    voiceBuffer = "";
    void askFollowUp();
  }
});
$("thread-clear").addEventListener("click", () => {
  turns = [];
  renderThread();
});

/* ---------- manual auto-type deck part 1: state + render ---------- */
let typeDeck = [];
let typingDeck = false;
async function loadTypeDeck() {
  try {
    const s = await chrome.storage.local.get(["typeDeck"]);
    if (Array.isArray(s.typeDeck)) typeDeck = s.typeDeck.filter((x) => x && x.text && String(x.text).trim()).slice(0, 200);
  } catch {}
}
async function saveTypeDeck() { try { await chrome.storage.local.set({ typeDeck }); } catch {} }
function renderTypeDeck() {
  const list = $("type-list"); const count = $("type-count");
  if (!list) return;
  list.innerHTML = "";
  if (count) count.textContent = typeDeck.length + (typeDeck.length === 1 ? " slot" : " slots");
  const inline = $("type-count-inline"); if (inline) inline.textContent = typeDeck.length + (typeDeck.length === 1 ? " slot" : " slots");
  if (!typeDeck.length) { const d = document.createElement("div"); d.className = "type-empty"; d.textContent = "Deck is empty — paste text above and hit Add slot."; list.appendChild(d); return; }
  typeDeck.forEach((slot, idx) => {
    const card = document.createElement("div"); card.className = "type-card";
    const top = document.createElement("div"); top.className = "type-top";
    const num = document.createElement("span"); num.className = "type-num"; num.textContent = String(idx + 1).padStart(2, "0");
    const nm = document.createElement("div"); nm.className = "type-name"; nm.textContent = slot.name || ("Slot " + (idx + 1));
    const meta = document.createElement("span"); meta.className = "type-meta"; meta.textContent = String(slot.text || "").length + "ch";
    top.append(num, nm, meta);
    const tx = document.createElement("div"); tx.className = "type-text"; tx.textContent = slot.text;
    const tg = document.createElement("div"); tg.className = "type-target"; tg.textContent = "Target: " + (slot.targetLabel || "not assigned");
    const acts = document.createElement("div"); acts.className = "type-actions";
    const mk = (t, cls, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t; if (cls) b.className = cls; b.addEventListener("click", fn); return b; };
    acts.append(mk("Type", "primary", () => typeDeckSlot(idx, false)), mk("Pick field", "", () => assignDeckTarget(idx)), mk("Flash", "", () => flashDeckTarget(idx)), mk("Up", "", () => moveDeckSlot(idx, -1)), mk("Down", "", () => moveDeckSlot(idx, 1)), mk("Copy", "", () => copyDeckSlot(idx)), mk("Del", "danger", () => removeDeckSlot(idx)));
    card.append(top, tx, tg, acts);
    list.appendChild(card);
  });
}
function moveDeckSlot(i, d) { const j = i + d; if (j < 0 || j >= typeDeck.length) return; const s = typeDeck.splice(i, 1)[0]; typeDeck.splice(j, 0, s); saveTypeDeck(); renderTypeDeck(); }
function removeDeckSlot(i) { typeDeck.splice(i, 1); saveTypeDeck(); renderTypeDeck(); }
async function copyDeckSlot(i) { try { await navigator.clipboard.writeText(typeDeck[i].text); showStatus("Slot " + (i + 1) + " copied."); } catch { showError("Clipboard blocked."); } }
async function assignDeckTarget(i) {
  const slot = typeDeck[i]; if (!slot) return;
  showStatus("Slot " + (i + 1) + ": click the destination field on the page… (Esc cancels)");
  const pick = await pickOne("SLOT " + (i + 1) + " text", "slot " + (i + 1)).catch(() => null);
  if (!pick) { showStatus("Pick cancelled."); return; }
  slot.targetId = pick.id; slot.targetLabel = pick.label || "assigned field";
  await saveTypeDeck(); renderTypeDeck();
  showStatus("Slot " + (i + 1) + " assigned to: " + slot.targetLabel);
}
async function flashDeckTarget(i) {
  const slot = typeDeck[i]; if (!slot || !slot.targetId) { showStatus("No assigned field yet - use Pick field first."); return; }
  try {
    await runOnPage((id) => { const el = document.querySelector(`[data-nutshell-fill="${id}"]`); if (!el) return { ok: false }; el.scrollIntoView({ block: "center" }); const p = document.createElement("div"); const r = el.getBoundingClientRect(); Object.assign(p.style, { position: "fixed", left: (r.left - 3) + "px", top: (r.top - 3) + "px", width: (r.width + 6) + "px", height: (r.height + 6) + "px", border: "2px solid #b88cff", borderRadius: "6px", zIndex: 2147483646, pointerEvents: "none" }); document.documentElement.appendChild(p); setTimeout(() => p.remove(), 900); return { ok: true }; }, [slot.targetId]);
    showStatus("Flashed target for slot " + (i + 1) + ".");
  } catch (e) { showError(e?.message || "Can't reach the page."); }
}
async function addDeckSlot() {
  const raw = String($("type-paste")?.value || "");
  if (!raw.trim()) { showError("Paste some text first, then hit Add slot."); return; }
  const custom = String($("type-name")?.value || "").trim();
  const pending = window.__deckPendingTarget && window.__deckPendingTarget.id ? window.__deckPendingTarget : null;
  typeDeck.push({ id: "slot-" + Date.now() + "-" + Math.floor(Math.random() * 1e6), name: custom || ("Slot " + (typeDeck.length + 1)), text: raw, targetId: pending ? pending.id : null, targetLabel: pending ? pending.label : "" });
  window.__deckPendingTarget = null;
  await saveTypeDeck(); renderTypeDeck();
  if ($("type-paste")) $("type-paste").value = ""; if ($("type-name")) $("type-name").value = "";
  showStatus("Queued as slot " + typeDeck.length + ".");
}
async function typeDeckSlot(i, fromAll) {
  const slot = typeDeck[i]; if (!slot) return { ok: false };
  if (!fromAll && (typingDeck || typing)) { showError("Already typing - hit Stop first."); return { ok: false }; }
  if (!slot.targetId) {
    let found = null;
    try {
      found = await runOnPage(() => {
        const els = [...document.querySelectorAll("textarea, input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=submit]):not([type=button]), [contenteditable=true]")].filter((el) => el.offsetParent !== null && !el.disabled && !el.readOnly);
        const el = els[0]; if (!el) return { ok: false };
        const id = "nutshell-manual-" + Math.random().toString(36).slice(2);
        el.setAttribute("data-nutshell-fill", id);
        return { ok: true, id, label: "auto-matched field" };
      }, []);
    } catch (e) { found = null; if (!fromAll) showError(e?.message || "Can't reach the page."); return { ok: false }; }
    if (!found?.ok) { if (!fromAll) showError("No typable field found - open the page, then use Pick field."); return { ok: false }; }
    slot.targetId = found.id; slot.targetLabel = "auto-matched field"; await saveTypeDeck(); renderTypeDeck();
  }
  try {
    showStatus("Typing slot " + (i + 1) + " (" + slot.name + ")...");
    typing = true;
    const res = await runOnPage(applyFillOnPage, [[{ id: slot.targetId, fill: slot.text }], currentDelay()]);
    if (res?.stopped) { if (!fromAll) showStatus("Typing stopped."); return { ok: false }; }
    if ((res?.filled || 0) === 0) { if (!fromAll) showError("That field is gone or not typable — Pick field again, then retry."); return { ok: false }; }
    if (!fromAll) showStatus("Slot " + (i + 1) + " typed into " + (slot.targetLabel || "field") + ".");
    return { ok: true };
  } catch (e) { if (!fromAll) showError(e?.message || "Typing failed."); return { ok: false }; }
  finally { typing = false; }
}
async function typeAllDeck() {
  if (typingDeck || typing) return; if (!typeDeck.length) { showError("Deck is empty - add a slot first."); return; }
  typingDeck = true; updateDeckStop();
  for (let i = 0; i < typeDeck.length; i++) {
    if (!typingDeck) break;
    const r = await typeDeckSlot(i, true);
    if (!typingDeck) break;
    if (!r?.ok) { showError("Stopped: slot " + (i + 1) + " could not type. Pick its field, then retry."); break; }
    if (i < typeDeck.length - 1) await new Promise((r2) => setTimeout(r2, 450));
  }
  typingDeck = false; updateDeckStop();
  try { await runOnPage(() => { window.__nutshellStopFill = false; }, []); } catch {}
  showStatus("Deck run finished.");
}
function updateDeckStop() { const s = $("type-stop"); if (s) s.classList.toggle("hidden", !typingDeck); }
function setTyperOpen(open, persist = true) {
  const body = $("typer-body"); const btn = $("typer-toggle");
  if (!body || !btn) return;
  body.classList.toggle("hidden", !open);
  btn.setAttribute("aria-expanded", open ? "true" : "false");
  if (persist) { try { chrome.storage.local.set({ typerOpen: !!open }); } catch {} }
}
function initTypeDeck() {
  loadTypeDeck().then(renderTypeDeck);
  try { chrome.storage.local.get(["typerOpen"], (s) => { if (s && typeof s.typerOpen === "boolean") setTyperOpen(s.typerOpen, false); }); } catch {}
  $("typer-toggle")?.addEventListener("click", () => setTyperOpen($("typer-body")?.classList.contains("hidden"), true));
  $("type-add")?.addEventListener("click", addDeckSlot);
  $("type-pick")?.addEventListener("click", async () => {
    const raw = String($("type-paste")?.value || "");
    if (!raw.trim()) { showError("Paste some text first, then hit Pick field."); return; }
    showStatus("Click the destination field on the page… (Esc cancels)");
    const pick = await pickOne("manual text", "").catch(() => null);
    if (!pick) { showStatus("Pick cancelled."); return; }
    window.__deckPendingTarget = { id: pick.id, label: pick.label || "assigned field" };
    showStatus("Field picked: " + (pick.label || "assigned field") + " — now hit Add slot to queue this text to it.");
  });
  $("type-clear-paste")?.addEventListener("click", () => { if ($("type-paste")) $("type-paste").value = ""; if ($("type-name")) $("type-name").value = ""; });
  $("type-clipboard")?.addEventListener("click", async () => { try { const t = await navigator.clipboard.readText(); if (!t?.trim()) { showError("Clipboard is empty."); return; } $("type-paste").value = t; showStatus("Clipboard pasted - review, then Add slot."); } catch { showError("Clipboard blocked - paste with Ctrl+V."); } });
  $("type-all")?.addEventListener("click", typeAllDeck);
  $("type-stop")?.addEventListener("click", () => { typingDeck = false; try { runOnPage(() => { window.__nutshellStopFill = true; }, []); } catch {} updateDeckStop(); showStatus("Stopping deck..."); });
  $("type-clear-all")?.addEventListener("click", async () => { typeDeck = []; await saveTypeDeck(); renderTypeDeck(); showStatus("Deck cleared."); });
}
/* ---------- restore state / init ---------- */
chrome.storage.local.get(["pendingText", "lastItems", "answerStyle", "fillMode", "fillWpm", "fillInstant", "fillWhere"], async (store) => {
  if (store.fillWhere === "choose") { fillWhere = "choose"; paintWhere(); }
  if (Number(store.fillWpm) >= WPM_MIN && Number(store.fillWpm) <= WPM_MAX) fillWpm = Number(store.fillWpm);
  else if (store.fillMode === "fast") fillWpm = 400;
  else if (store.fillMode === "normal") fillWpm = 120;
  fillInstant = typeof store.fillInstant === "boolean" ? store.fillInstant : store.fillMode === "instant";
  $("fill-wpm").value = wpmToPos(fillWpm);
  $("fill-instant").checked = fillInstant;
  updateFillEstimate();
  if (["short", "detailed", "ultra"].includes(store.answerStyle)) {
    answerStyle = store.answerStyle;
    document.querySelectorAll(".style-choice").forEach((choice) => {
      choice.classList.toggle("selected", choice.dataset.answerStyle === answerStyle);
    });
  }
  if (store.pendingText) {
    input.value = store.pendingText;
    chrome.storage.local.remove("pendingText");
  } else if (Array.isArray(store.lastItems) && store.lastItems.length) {
    items = store.lastItems;
    render(items);
  }

  await getState();
  renderActivationStatus();
  try { initTypeDeck(); } catch {}

  await initAISettings();
  const boot = $("boot");
  const bootCopy = $("boot-copy");
  if (!NutshellAI.hasProvider(aiCfg)) {
    bootCopy.textContent = "Add an API key in ⚙ to get started";
    aiNote("Pick a provider and paste a free API key, then hit Test.");
    setTimeout(() => showStatus("Tap ⚙ to add a free API key (Groq or Gemini) and get started."), 1300);
  } else {
    bootCopy.textContent = "NUTSHELL is set.";
  }
  setTimeout(() => boot.classList.add("boot-out"), 1150);
});
