// ページの読み込み時に実行
document.addEventListener("turbo:load", () => {
  // 出発時間や到着時間を計算する関数を設定
  setupTimeCalculations();

  // しおりの登録ボタンを設定
  setupSaveButton();
});

// === セレクトボックスから時間を取得 ===
function getTimeFromGroup(groupEl) {
  const hourSelect = groupEl.querySelector(".hour-select");
  const minuteSelect = groupEl.querySelector(".minute-select");
  if (!hourSelect || !minuteSelect) return "00:00";
  const h = hourSelect.value.padStart(2, "0");
  const m = minuteSelect.value.padStart(2, "0");
  return `${h}:${m}`;
}

// === 時間計算関連 ===
function setupTimeCalculations() {
  const departureGroup = document.querySelector(".time-select-group.departure-time");
  const travelGroups = document.querySelectorAll(".time-select-group.travel-time");
  const arrivalDisplays = document.querySelectorAll(".arrival-time.time-display");
  const stayGroups = document.querySelectorAll(".time-select-group.stay-time");
  const nextDepartureDisplays = document.querySelectorAll(".next-departure-time.time-display");

  // セレクトボックスの変更イベントを監視
  const allSelects = document.querySelectorAll(".time-select");
  allSelects.forEach((select) => {
    select.addEventListener("change", () => {
      calculateTimes();
    });
  });

  // 初回計算
  calculateTimes();

  // 時間を計算する関数
  function calculateTimes() {
    let currentDepartureTime = parseTime(departureGroup ? getTimeFromGroup(departureGroup) : "00:00");

    travelGroups.forEach((travelGroup, index) => {
      const travelTime = parseTime(getTimeFromGroup(travelGroup));
      const stayTime = parseTime(stayGroups[index] ? getTimeFromGroup(stayGroups[index]) : "00:00");

      // 出発時間と移動時間を足して、到着予定時間を計算
      const arrivalTime = addTimes(currentDepartureTime, travelTime);
      if (arrivalDisplays[index]) {
        arrivalDisplays[index].textContent = formatTime(arrivalTime);
        arrivalDisplays[index].dataset.value = formatTime(arrivalTime);
      }

      // 到着時間と滞在時間を足して出発予定時間を計算
      const nextDepartureTime = addTimes(arrivalTime, stayTime);
      if (nextDepartureDisplays[index]) {
        nextDepartureDisplays[index].textContent = formatTime(nextDepartureTime);
        nextDepartureDisplays[index].dataset.value = formatTime(nextDepartureTime);
      }

      currentDepartureTime = nextDepartureTime; // 次の出発時間を更新
    });

    // 時間計算後に警告チェック
    checkWarnings();
  }
}

// === 警告チェック: 休館日・営業時間外 ===
function checkWarnings() {
  const scheduleData = document.getElementById("day-schedule-data");
  if (!scheduleData) return;

  const visitDate = scheduleData.dataset.visitDate;   // "MM-DD"
  const visitWday = parseInt(scheduleData.dataset.visitWday);  // 0=日, 1=月, ..., 6=土
  const visitMday = parseInt(scheduleData.dataset.visitMday);  // 日(1-31)

  const destinationBlocks = document.querySelectorAll(".destination-details-block");

  destinationBlocks.forEach((block) => {
    const arrivalDisplay = block.querySelector(".arrival-time.time-display");
    const arrivalTimeStr = arrivalDisplay ? arrivalDisplay.dataset.value : null;

    // 休館日チェック
    const closedItems = block.querySelectorAll(".closed-day-item");
    closedItems.forEach((item) => {
      const closedInfo = item.dataset.closedInfo || "";
      const startDate = item.dataset.startDate || "";
      const endDate = item.dataset.endDate || "";

      if (isClosedDay(closedInfo, startDate, endDate, visitWday, visitDate, visitMday)) {
        item.classList.add("warning-closed");
      } else {
        item.classList.remove("warning-closed");
      }
    });

    // 営業時間チェック
    let hasClosedWarning = block.querySelector(".warning-closed") !== null;
    let hasOutsideHoursWarning = false;

    if (arrivalTimeStr && arrivalTimeStr !== "--:--") {
      const businessItems = block.querySelectorAll(".business-hour-item");
      businessItems.forEach((item) => {
        const opening = item.dataset.opening || "";
        const closing = item.dataset.closing || "";
        const bhStartDate = item.dataset.bhStartDate || "";
        const bhEndDate = item.dataset.bhEndDate || "";
        const startDay = item.dataset.startDay ? parseInt(item.dataset.startDay) : null;
        const endDay = item.dataset.endDay ? parseInt(item.dataset.endDay) : null;

        // この営業時間レコードが訪問日に該当するかチェック
        const dateMatch = isInDateRange(bhStartDate, bhEndDate, visitDate);
        const dayMatch = isInDayRange(startDay, endDay, visitWday);

        if (dateMatch && dayMatch) {
          // 該当する営業時間 → 到着時間が範囲外かチェック
          if (isOutsideBusinessHours(arrivalTimeStr, opening, closing)) {
            item.classList.add("warning-outside-hours");
            hasOutsideHoursWarning = true;
          } else {
            item.classList.remove("warning-outside-hours");
          }
        } else {
          item.classList.remove("warning-outside-hours");
        }
      });
    }

    // スタンプ押印可否チェック
    const stampItems = block.querySelectorAll(".stamp-hour-item");
    stampItems.forEach((item) => {
      const availableHour = item.dataset.availableHour || "";
      const stampRemarks = item.dataset.stampRemarks || "";

      item.classList.remove("stamp-available", "stamp-unavailable");

      // 警告が出ていない場合はスタンプ判定不要
      if (!hasClosedWarning && !hasOutsideHoursWarning) return;

      // 24時間押印可能 → 常にスタンプOK
      if (availableHour.includes("24時間")) {
        item.classList.add("stamp-available");
        return;
      }

      // 休館日で「休館日も押印可能」→ スタンプOK
      if (hasClosedWarning && stampRemarks.includes("休館日も押印可能")) {
        item.classList.add("stamp-available");
        return;
      }

      // 営業時間外で、スタンプに具体的な時間指定がある場合
      if (hasOutsideHoursWarning && arrivalTimeStr && arrivalTimeStr !== "--:--") {
        const stampTimeMatch = availableHour.match(/(\d{1,2}:\d{2})～(\d{1,2}:\d{2})/);
        if (stampTimeMatch) {
          if (!isOutsideBusinessHours(arrivalTimeStr, stampTimeMatch[1], stampTimeMatch[2])) {
            item.classList.add("stamp-available");
            return;
          }
        }
      }

      // 警告が出ていてスタンプも押せない場合
      if (hasClosedWarning && stampRemarks.includes("休館日は押印不可")) {
        item.classList.add("stamp-unavailable");
      } else if (hasOutsideHoursWarning && availableHour.includes("開館時間に同じ")) {
        item.classList.add("stamp-unavailable");
      }
    });
  });
}

// === 休館日判定 ===
// 曜日マッピング: 日=0, 月=1, 火=2, 水=3, 木=4, 金=5, 土=6 (JSのDate.getDay()と同じ)
const WDAY_MAP = { "日": 0, "月": 1, "火": 2, "水": 3, "木": 4, "金": 5, "土": 6 };

function isClosedDay(closedInfo, startDate, endDate, visitWday, visitDate, visitMday) {
  // 定休日なしはスキップ
  if (closedInfo.includes("定休日なし")) return false;

  // 日付範囲チェック（"M-D"形式のみ対応）
  const inRange = isInDateRange(startDate, endDate, visitDate);

  // 曜日パターンチェック
  for (const [char, wday] of Object.entries(WDAY_MAP)) {
    if (closedInfo.includes(char + "曜日")) {
      // 第N週チェック（「第2月曜日」「第1,第3水曜日」等）
      const nthMatch = closedInfo.match(/第(\d)/g);
      if (nthMatch) {
        const weekOfMonth = Math.ceil(visitMday / 7);
        const nthWeeks = nthMatch.map((m) => parseInt(m[1]));
        if (visitWday === wday && nthWeeks.includes(weekOfMonth) && inRange !== false) {
          return true;
        }
      } else {
        // 毎週パターン
        if (visitWday === wday && inRange !== false) return true;
      }
    }
  }

  // 曜日指定なし + 日付範囲のみ（年末年始等）
  if (inRange === true && !closedInfo.match(/曜日/)) return true;

  return false;
}

// === 日付範囲判定 ===
// "M-D" 形式 または "N月上旬/中旬/下旬" 形式の日付をパース
// 上旬=10日, 中旬=20日, 下旬=月末(28日で近似)
function parseMD(dateStr) {
  if (!dateStr) return null;

  // "M-D" 形式
  const mdMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})$/);
  if (mdMatch) return { month: parseInt(mdMatch[1]), day: parseInt(mdMatch[2]) };

  // "N月上旬/中旬/下旬" 形式
  const jpMatch = dateStr.match(/^(\d{1,2})月(上旬|中旬|下旬)$/);
  if (jpMatch) {
    const month = parseInt(jpMatch[1]);
    const period = jpMatch[2];
    const day = period === "上旬" ? 10 : period === "中旬" ? 20 : 28;
    return { month, day };
  }

  return null;
}

function mdToNumber(month, day) {
  return month * 100 + day;
}

function isInDateRange(startDateStr, endDateStr, visitDateStr) {
  const start = parseMD(startDateStr);
  const end = parseMD(endDateStr);
  const visit = parseMD(visitDateStr);

  if (!visit) return null;
  if (!start && !end) return null;  // 日付指定なし → 通年とみなす（null = 判定不能だが通年扱い）

  // 片方だけある場合は判定不能
  if (!start || !end) return null;

  const v = mdToNumber(visit.month, visit.day);
  const s = mdToNumber(start.month, start.day);
  const e = mdToNumber(end.month, end.day);

  if (s <= e) {
    // 通常範囲: 4-1 ~ 10-31
    return v >= s && v <= e;
  } else {
    // 年跨ぎ: 11-1 ~ 3-31
    return v >= s || v <= e;
  }
}

// === 曜日範囲判定（営業時間用）===
// start_day/end_day: 1=月, 2=火, ..., 7=日 (DBの定義)
// visitWday: 0=日, 1=月, ..., 6=土 (JSのDate.getDay())
function isInDayRange(startDay, endDay, visitWday) {
  if (startDay === null || endDay === null) return true;  // 曜日指定なし → 全曜日対象

  // DB形式(1=月~7=日)をJS形式(0=日~6=土)に変換
  function dbDayToJsWday(dbDay) {
    return dbDay === 7 ? 0 : dbDay;
  }

  const s = dbDayToJsWday(startDay);
  const e = dbDayToJsWday(endDay);

  if (s <= e) {
    return visitWday >= s && visitWday <= e;
  } else {
    // 週跨ぎ（金~日 等）
    return visitWday >= s || visitWday <= e;
  }
}

// === 営業時間外判定 ===
function isOutsideBusinessHours(arrivalTimeStr, openingStr, closingStr) {
  if (!openingStr || !closingStr) return false;

  const arrival = timeToMinutes(arrivalTimeStr);
  const opening = timeToMinutes(openingStr);
  const closing = timeToMinutes(closingStr);

  return arrival < opening || arrival > closing;
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}


// === 保存関連 ===
function setupSaveButton() {
  const saveButton = document.querySelector("#register_time");
  if (!saveButton) {
    console.error("Save button not found");
    return;
  }

  saveButton.addEventListener("click", () => {
    console.log("Saving time managements...");

    const timeManagements = [];
    const destinationBlocks = document.querySelectorAll(".destination-details-block");
    const travelTimeBlocks = document.querySelectorAll(".travel-time-block");

    destinationBlocks.forEach((block, index, array) => {
      const destinationId = block.dataset.destinationId;
      const arrivalDisplay = block.querySelector(".arrival-time.time-display");
      const arrivalTime = arrivalDisplay ? arrivalDisplay.dataset.value : null;
      const isLast = index === array.length - 1;

      const nextDepartureDisplay = block.querySelector(".next-departure-time.time-display");
      const departureTime = isLast ? arrivalTime : (nextDepartureDisplay ? nextDepartureDisplay.dataset.value : null);

      // 移動時間はセレクトグループから取得
      const travelGroup = travelTimeBlocks[index]?.querySelector(".time-select-group.travel-time");
      const stayGroup = block.querySelector(".time-select-group.stay-time");

      const travelTime = travelGroup ? getTimeFromGroup(travelGroup) : "00:00";
      const stayDuration = isLast ? "00:00" : (stayGroup ? getTimeFromGroup(stayGroup) : "00:00");

      console.log(`Dest ${destinationId}: arrival=${arrivalTime} departure=${departureTime} travel=${travelTime} stay=${stayDuration}`);

      if (!destinationId || !arrivalTime || !departureTime) {
        console.error(`Missing data for destination ID: ${destinationId}`);
        return;
      }

      timeManagements.push({
        destination_id: parseInt(destinationId, 10),
        arrival_time: arrivalTime,
        departure_time: departureTime,
        custom_travel_time: travelTime,
        stay_duration: stayDuration,
      });
    });

    console.log("Collected time managements:", timeManagements);

    fetch("/time_managements", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify({ timeManagements }),
    })
      .then(response => response.ok ? response.json() : Promise.reject("Failed to save"))
      .then(data => {
        console.log("Server response:", data.message);
        const scheduleData = document.getElementById("day-schedule-data");
        const itineraryId = scheduleData.dataset.itineraryId;

        // しおり確認画面へ戻る
        window.location.href = `/itineraries/${itineraryId}`;
      })
      .catch(error => console.error("Error:", error));
  });
}

// === 補助関数 ===
function parseTime(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return { hours: hours || 0, minutes: minutes || 0 };
}

function addTimes(time1, time2) {
  const totalMinutes = time1.minutes + time2.minutes;
  const totalHours = time1.hours + time2.hours + Math.floor(totalMinutes / 60);
  return { hours: totalHours % 24, minutes: totalMinutes % 60 };
}

function formatTime(time) {
  return `${time.hours.toString().padStart(2, "0")}:${time.minutes.toString().padStart(2, "0")}`;
}
