const video = document.getElementById('webcam');
const canvas = document.getElementById('proc-canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const gridOverlay = document.getElementById('grid-overlay');
const tableBody = document.getElementById('table-body');
const labels = ['A','B','C','D'];
const spotsData = [];

function initApp() {
    for (let i = 0; i < 20; i++) {
        const pos = `${labels[i % 4]}${Math.floor(i / 4) + 1}`;
        const cell = document.createElement('div');
        cell.className = 'grid-cell';
        
        const spot = document.createElement('div');
        spot.className = 'spot';
        
        const info = document.createElement('div');
        info.className = 'cell-info';
        info.id = `grid-val-${i}`;
        
        const tr = document.createElement('tr');
        tr.id = `row-${i}`;
        tr.innerHTML = `<td>${pos}</td><td class="type">-</td><td class="int">-</td><td class="res">ND</td>`;
        tableBody.appendChild(tr);

        let state = 0; // 0:ND, 1:Sample, 2:Normal, 3:Deficient
        
        cell.onclick = () => {
            // ตรรกะการวนรอบ: ถ้าเป็น 0 ให้เริ่มที่ 1, ถ้าไม่ใช่ 0 ให้วน 1->2->3->1
            if (state === 0) {
                state = 1;
            } else {
                state = (state % 3) + 1;
            }
            
            // อัปเดต Class เพื่อเปลี่ยนสีเส้นขอบใน CSS
            const classNames = ['spot', 'spot sample', 'spot normal', 'spot deficient'];
            spot.className = classNames[state];
            
            spotsData[i].type = state;
            updateRowType(i, state);
        };

        cell.appendChild(spot);
        cell.appendChild(info);
        gridOverlay.appendChild(cell);
        spotsData.push({ id: i, pos: pos, type: 0, el: info, row: tr });
    }

    startCamera();
    requestAnimationFrame(processLoop);
}

function updateRowType(index, type) {
    // อัปเดตชื่อประเภทตามที่คุณต้องการ
    const types = ['ND', 'SAMPLE', 'QC NORM', 'QC DEF'];
    const row = spotsData[index].row;
    row.querySelector('.type').innerText = types[type];
    
    // หากกลับมาเป็น ND (ถ้ามี) ให้ล้างค่า
    if(type === 0) {
        spotsData[index].el.innerHTML = '';
        row.querySelector('.res').innerText = 'ND';
    }
}

// ... (ฟังก์ชัน rgbToHsv, processLoop, updateRealtimeUI, updateClock, startCamera คงเดิมจากโค้ดเดิมของคุณ) ...

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
            if (spot.type === 0) return; 

            const x = offset + (i % 4) * cellW + (cellW * 0.3);
            const y = offset + Math.floor(i / 4) * cellH + (cellH * 0.3);
            const imgData = ctx.getImageData(x, y, cellW * 0.4, cellH * 0.4).data;

            let vSum = 0, blueCount = 0;
            for (let j = 0; j < imgData.length; j += 4) {
                const hsv = rgbToHsv(imgData[j], imgData[j+1], imgData[j+2]);
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

    const infoEl = spotsData[index].el;
    infoEl.className = `cell-info ${cls}`;
    infoEl.innerHTML = `${val.toFixed(0)}%<br>${res}`;

    const row = spotsData[index].row;
    row.querySelector('.int').innerText = val.toFixed(1);
    const resCell = row.querySelector('.res');
    resCell.innerText = res;
    resCell.className = `res ${cls}`;
}

function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleString('th-TH');
}

function startCamera() {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: 1280 } })
        .then(s => video.srcObject = s)
        .catch(err => console.error("Camera error:", err));
}

document.getElementById('save-btn').onclick = () => {
    const reportCanvas = document.createElement('canvas');
    reportCanvas.width = video.videoWidth;
    reportCanvas.height = video.videoHeight;
    const rCtx = reportCanvas.getContext('2d');
    rCtx.drawImage(video, 0, 0);
    
    // Watermark
    rCtx.fillStyle = "rgba(0,0,0,0.7)";
    rCtx.fillRect(0, 0, reportCanvas.width, 160);
    rCtx.fillStyle = "#00ff00";
    rCtx.font = "bold 40px Arial";
    rCtx.fillText("G6PD ANALYZER PRO REPORT", 40, 60);
    
    const link = document.createElement('a');
    link.download = `G6PD_ANALYSIS_${Date.now()}.png`;
    link.href = reportCanvas.toDataURL('image/png');
    link.click();
};

document.getElementById('reset-btn').onclick = () => location.reload();

initApp();
