const fs = require('fs');
const path = require('path');

const mainJsPath = path.join(__dirname, '..', 'src', 'main.js');
let code = fs.readFileSync(mainJsPath, 'utf8');

// Replace function signature if not already done
if (code.includes('function setEnvironment(time) {')) {
  code = code.replace('function setEnvironment(time) {', 'function setEnvironment(time, isUserAction = false) {');
  console.log('Updated setEnvironment signature');
}

const sIdx = code.indexOf('// Phản ứng sinh hoạt của CBNV khi chuyển đổi Ngày / Đêm');
const eIdx = code.indexOf('logoLight.intensity =', sIdx);

if (sIdx !== -1 && eIdx !== -1) {
  const newReaction = `// Phản ứng sinh hoạt của CBNV khi chuyển đổi Ngày / Đêm (CHỈ KÍCH HOẠT KHI NGƯỜI DÙNG BẤM NÚT, KHÔNG HIỆN KHI MỞ TRANG)
  if (isUserAction) {
    if (isNight) {
      showCampusToast('🌙 Trời tối - Đèn đường bật sáng: Mọi người đi bộ & chạy vào Nhà Ăn CBNV dùng bữa tối!', 'night');
      triggerEventSpeechBubbles('night');
    } else if (time === 'day' || time === 'sunset') {
      showCampusToast(time === 'day' ? '☀️ Bắt đầu ngày mới: Mọi người trở lại vị trí làm việc và tiếp tục các hoạt động!' : '🌇 Chiều hoàng hôn: Không khí mát mẻ, làm việc hăng say!', 'day');
      triggerEventSpeechBubbles('day');
    }
  }

  `;
  code = code.slice(0, sIdx) + newReaction + code.slice(eIdx);
  console.log('Protected reaction block with isUserAction');
} else {
  console.error('Could not find reaction block boundaries:', sIdx, eIdx);
}

// Pass isUserAction = true on click
const clickTarget = 'setEnvironment(btn.dataset.time);';
if (code.includes(clickTarget)) {
  code = code.replace(clickTarget, 'setEnvironment(btn.dataset.time, true);');
  console.log('Updated click listener to set isUserAction = true');
} else {
  console.log('clickTarget not found or already updated');
}

fs.writeFileSync(mainJsPath, code, 'utf8');
console.log('Saved main.js');
