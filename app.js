const video = document.getElementById('webcam');
const canvas = document.getElementById('proc-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const gridOverlay = document.getElementById('grid-overlay');
const tableBody = document.getElementById('table-body');
const labels = ['A','B','C','D'];
const spotsData = [];

// 1. Recursive Loop & Performance Setup
function initApp() {
    // สร้างพิกัด Grid 4x5
    for (let i = 0; i < 20; i++) {
        const pos = `${labels[i % 4]}${Math.floor(i / 4) + 1}`;
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        const spot = document.createElement('div');
        spot.className = 'spot';
        
        const info = document.createElement('div');
        info.className = 'cell-info';
        info.id = `grid-val-${i}`;
        
        // Cache Table Row เพื่อ Performance (ไม่ต้องสร้างใหม่ใน Loop)
        const tr = document.createElement('tr');
        tr.id = `row-${i}`;
        tr.innerHTML = `<td>${pos}</td><td class="type">-</td><td class="int">-</td><td class="res">ND</td>`;
        tableBody.appendChild(tr);

        let state = 0; // 0:ND, 1:Sample, 2:Normal, 3:Deficient
        cell.onclick = () => {
            state = (state + 1) % 4;
            spot.className = ['spot', 'spot sample', 'spot normal', 'spot deficient'][state];
            spotsData[i].type = state;
            updateRowType(i, state);
        };

        cell.appendChild(spot);
        cell.appendChild(info);
        gridOverlay.appendChild(cell);
        spotsData.push({ id: i, pos: pos, type: 0, el: info, row: tr });
    }

    startCamera();
    requestAnimationFrame(processLoop); // เริ่มหัวใจการทำงาน
}

// 2. HSV Calculation (คัดกรองสีฟ้า 190-240 องศา)
function rgbToHsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    let h;
    if (d === 0) h = 0;
    else if (max === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    return { h: h * 60, s: max === 0 ? 0 : d / max, v: max };
}

// 3. Main Live Loop (ทำงานเฉพาะจุดที่ถูกเลือก)
function processLoop() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        const ratio = video.videoWidth / video.clientWidth;
        const offset = 10 * ratio;
        const cellW = (canvas.width - offset*2) / 4;
        const cellH = (canvas.height - offset*2) / 5;

        spotsData.forEach((spot, i) => {
            // ประหยัด Performance: วิเคราะห์เฉพาะจุดที่ไม่ใช่ ND
            if (spot.type === 0) return; 

            const x = offset + (i % 4) * cellW + (cellW * 0.3);
            const y = offset + Math.floor(i / 4) * cellH + (cellH * 0.3);
            const imgData = ctx.getImageData(x, y, cellW * 0.4, cellH * 0.4).data;

            let vSum = 0, blueCount = 0;
            for (let j = 0; j < imgData.length; j += 4) {
                const hsv = rgbToHsv(imgData[j], imgData[j+1], imgData[j+2]);
                // ตรวจจับเฉพาะเฉดสีฟ้า (190-240)
                if (hsv.h >= 190 && hsv.h <= 240 && hsv.s > 0.2) {
                    vSum += hsv.v;
                    blueCount++;
                }
            }

            const intensity = blueCount > 0 ? (vSum / blueCount) * 100 : 0;
            updateRealtimeUI(i, intensity);
        });
    }
    updateClock();
    requestAnimationFrame(processLoop);
}

function updateRealtimeUI(index, val) {
    let res = 'Deficient', cls = 'text-deficient';
    if (val > 70) { res = 'Normal'; cls = 'text-normal'; }
    else if (val > 30) { res = 'Partial'; cls = 'text-partial'; }

    // อัปเดตใน Grid
    const infoEl = spotsData[index].el;
    infoEl.className = `cell-info ${cls}`;
    infoEl.innerHTML = `${val.toFixed(0)}%<br>${res}`;

    // อัปเดตในตาราง
    const row = spotsData[index].row;
    row.querySelector('.int').innerText = val.toFixed(1);
    const resCell = row.querySelector('.res');
    resCell.innerText = res;
    resCell.className = `res ${cls}`;
}

function updateRowType(index, type) {
    const types = ['ND', 'SAMPLE', 'QC NORM', 'QC DEF'];
    spotsData[index].row.querySelector('.type').innerText = types[type];
    if(type === 0) {
        spotsData[index].el.innerHTML = '';
        spotsData[index].row.querySelector('.res').innerText = 'ND';
        spotsData[index].row.querySelector('.res').className = 'res text-nd';
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleString('th-TH');
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 1280 } })
        .then(s => video.srcObject = s);
}

// ฟังก์ชัน Capture พร้อม Watermark
document.getElementById('save-btn').onclick = () => {
    const reportCanvas = document.createElement('canvas');
    reportCanvas.width = canvas.width;
    reportCanvas.height = canvas.height;
    const rCtx = reportCanvas.getContext('2d');

    // 1. วาดรูปจากกล้อง
    rCtx.drawImage(video, 0, 0);
    
    // 2. วาด Watermark & วันที่
    rCtx.fillStyle = "rgba(0,0,0,0.5)";
    rCtx.fillRect(0, 0, reportCanvas.width, 120);
    rCtx.fillStyle = "white";
    rCtx.font = "bold 30px Arial";
    rCtx.fillText("G6PD Analyzer Pro Report", 30, 50);
    rCtx.font = "24px Arial";
    rCtx.fillText(`Date: ${new Date().toLocaleString('th-TH')}`, 30, 90);

    // 3. ดาวน์โหลด
    const link = document.createElement('a');
    link.download = `G6PD_Result_${Date.now()}.png`;
    link.href = reportCanvas.toDataURL();
    link.click();
};

document.getElementById('reset-btn').onclick = () => location.reload();

initApp();
