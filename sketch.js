// ==========================================
// 全局變數定義 (Global Variables)
// ==========================================

// 關卡資料集 (包含品牌、寫實照片、介紹及價格資訊)
let questionsData = [
  {
    brand: "賓士 (Mercedes-Benz)",                                                   // 品牌名稱
    imgUrl: "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=800&auto=format&fit=crop", // 賓士寫實照片網址
    intro: "德國經典豪華汽車品牌，以精湛工程品質、極佳行車舒適性與尊榮品質聞名全台。",       // 品牌介紹
    price: "約 NT$ 210 萬 - 1,500 萬元起"                                             // 參考價格
  },
  {
    brand: "特斯拉 (Tesla)",                                                        // 品牌名稱
    imgUrl: "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=800&auto=format&fit=crop", // 特斯拉寫實照片網址
    intro: "全球電動車領導品牌，具備極簡座艙設計、強勁加速性能與先進 Autopilot 輔助駕駛。",    // 品牌介紹
    price: "約 NT$ 175 萬 - 380 萬元起"                                             // 參考價格
  },
  {
    brand: "寶馬 (BMW)",                                                            // 品牌名稱
    imgUrl: "https://images.unsplash.com/photo-1555215695-3004980ad54e?w=800&auto=format&fit=crop", // 寶馬寫實照片網址
    intro: "標榜「純粹駕馭樂趣」的德國豪華品牌，以靈敏操控性、雙腎型水箱護罩特色廣受喜愛。",      // 品牌介紹
    price: "約 NT$ 205 萬 - 1,000 萬元起"                                           // 參考價格
  }
];

let currentLevel = 0;           // 當前關卡索引 (0, 1, 2)
let currentImg = null;          // 當前載入的汽車圖片物件
let pieces = [];                // 存放 9 塊正方形拼圖物件的陣列
let boardCells = [];            // 左側目標拼圖格子的座標資訊

// 遊戲狀態控制 ("START", "PLAYING", "LEVEL_CLEAR", "GAME_OVER")
let gameState = "START";        // 遊戲初始狀態設為首頁開始畫面
let startTime = 0;              // 遊戲開始的時間戳記 (毫秒)
let totalElapsedTime = 0;       // 完成三關總共耗時 (秒)
let fireworks = [];             // 存放通關煙火粒子的陣列

// 音效控制變數
let bgmMusic;                   // 宣告背景音樂變數

// 拖曳狀態管理
let draggedPiece = null;        // 當前正在被滑鼠拖曳的拼圖物件
let offsetX = 0;                // 拖曳時滑鼠與拼圖左上角的 X 軸偏移量
let offsetY = 0;                // 拖曳時滑鼠與拼圖左上角的 Y 軸偏移量

// ==========================================
// p5.js 預載與初始化函數 (Preload & Setup)
// ==========================================

// p5.js 預載函式：在畫面渲染前先載入資源
function preload() {
  loadLevelImage(currentLevel); // 呼叫載入圖片函式並傳入當前關卡
  
  // 載入指定的背景音樂檔
  bgmMusic = loadSound('mickeyscat-old-film-ragtime-627015.mp3'); 
}

// 載入指定關卡的汽車圖片
function loadLevelImage(levelIndex) {
  // 使用 p5.js 的 loadImage 非同步載入網路圖片
  currentImg = loadImage(questionsData[levelIndex].imgUrl, () => {
    initPuzzleBoard(); // 圖片成功載入完成後執行拼圖板初始化
  });
}

// p5.js 設定畫布函式 (setup)
function setup() {
  createCanvas(windowWidth, windowHeight); // 創建填滿整個視窗的響應式畫布
  rectMode(CORNER);                        // 設定矩形繪製模式為左上角對齊
  initPuzzleBoard();                       // 初始化拼圖板與拼圖碎片的資料
}

// 視窗大小改變時的響應式調整函式 (windowResized)
function windowResized() {
  resizeCanvas(windowWidth, windowHeight); // 當視窗縮放時自動重置畫布大小
  initPuzzleBoard();                       // 重新計算版面並初始化拼圖板
}

// ==========================================
// 拼圖板與正方形拼圖碎片初始化邏輯
// ==========================================

// 初始化拼圖板佈局與 9 塊拼圖資料
function initPuzzleBoard() {
  boardCells = []; // 清空左側目標格子陣列
  pieces = [];     // 清空右側拼圖碎片陣列
  
  let halfWidth = width / 2; // 計算畫布的一半寬度作為左右分界
  
  let maxW = halfWidth * 0.75; // 設定左側拼圖板最大寬度為半個畫布的 75%
  let maxH = height * 0.55;    // 設定拼圖板最大高度為螢幕高度的 55%
  
  // 計算符合 3:2 畫面比例的寬高
  let boardW = maxW; 
  let boardH = boardW * (2 / 3); 
  
  // 若高度超出最大限制，則改以高度為基準進行等比例縮放
  if (boardH > maxH) { 
    boardH = maxH; 
    boardW = boardH * (1.5); 
  }
  
  // 計算左側對應拼圖板的起始 X 與 Y 座標 (置中於左半邊)
  let boardStartX = (halfWidth - boardW) / 2; 
  let boardStartY = (height - boardH) / 2 + 30; 
  
  // 計算單個九宮格拼圖塊的寬高
  let cellW = boardW / 3; 
  let cellH = boardH / 3; 
  
  // 透過洗牌演算法隨機產生右側 3x3 散落區的格子位置，確保不重疊
  let slots = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      slots.push({ r: r, c: c });
    }
  }
  slots = shuffle(slots); // 隨機打亂位置順序

  let index = 0; // 初始化拼圖編號計數器
  for (let r = 0; r < 3; r++) { 
    for (let c = 0; c < 3; c++) { 
      // 計算左側目標格子的正確放置座標
      let targetX = boardStartX + c * cellW; 
      let targetY = boardStartY + r * cellH; 
      
      // 將目標格子資訊存入陣列
      boardCells.push({ 
        x: targetX, 
        y: targetY, 
        w: cellW,   
        h: cellH    
      });
      
      // 取得洗牌後的隨機散落格子
      let slot = slots[index];
      let rightStartX = halfWidth + (halfWidth - boardW) / 2; // 右側區域起始 X 座標
      let randomX = rightStartX + slot.c * cellW;             // 計算拼圖初始 X 座標
      let randomY = boardStartY + slot.r * cellH;             // 計算拼圖初始 Y 座標
      
      // 建立單個正方形拼圖物件並放入陣列
      pieces.push({ 
        id: index,               // 拼圖編號 (0 到 8)
        row: r,                  // 所在的橫排索引 (0-2)
        col: c,                  // 所在的直行索引 (0-2)
        x: randomX,              // 當前實體位置 X (位於右側)
        y: randomY,              // 當前實體位置 Y (位於右側)
        targetX: targetX,        // 正確對應位置 X (位於左側)
        targetY: targetY,        // 正確對應位置 Y (位於左側)
        w: cellW,                // 拼圖寬度
        h: cellH,                // 拼圖高度
        isUnlocked: true,        // 預設解鎖
        isSnapped: false         // 標記是否已成功吸附至正確位置
      });
      
      index++; // 遞增編號
    }
  }
}

// ==========================================
// p5.js 繪圖主迴圈 (draw)
// ==========================================

function draw() {
  background(168, 218, 220); // 每一影格重新清除背景，設定為指定背景顏色 #a8dadc
  
  if (gameState === "START") {
    drawStartScreen();     // 若為首頁狀態，繪製開始測驗按鈕介面
  } else if (gameState === "PLAYING" || gameState === "LEVEL_CLEAR") { 
    drawHeaderUI();        // 繪製頂部標題、品牌介紹與價格資訊
    drawLeftBoard();       // 繪製左側目標半透明原圖底板與框架
    drawRightArea();       // 繪製右側待拼湊的正方形拼圖區域
    
    if (gameState === "LEVEL_CLEAR") { 
      drawLevelClearBanner(); // 若當前關卡完成，繪製通關橫幅提示
    }
  } else if (gameState === "GAME_OVER") { 
    drawGameOverScreen();  // 若三關全數完成，繪製最終結算畫面與煙火特效
  }
}

// ==========================================
// 介面與圖形繪製函數 (UI & Rendering)
// ==========================================

// 繪製「點擊開始測驗」首頁畫面
function drawStartScreen() {
  let cardW = min(500, width * 0.85); // 計算提示卡片寬度
  let cardH = 300;                    // 設定提示卡片高度
  let cardX = (width - cardW) / 2;    // 計算卡片置中 X 座標
  let cardY = (height - cardH) / 2;   // 計算卡片置中 Y 座標

  // 繪製白色半透明卡片背景
  fill(255, 255, 255, 230);
  stroke(69, 123, 157);
  strokeWeight(3);
  rect(cardX, cardY, cardW, cardH, 16);

  // 繪製標題文字
  fill(29, 53, 87);
  textAlign(CENTER, CENTER);
  textSize(28);
  textStyle(BOLD);
  text("台灣常見汽車品牌拼圖教學測驗", width / 2, cardY + 70);

  // 繪製說明文字
  textSize(16);
  textStyle(NORMAL);
  fill(69, 123, 157);
  text("探索台灣熱門汽車品牌，動手拼出精美寫實車照！", width / 2, cardY + 120);

  // 計算「開始測驗」按鈕的大小與位置
  let btnW = 180;
  let btnH = 50;
  let btnX = width / 2 - btnW / 2;
  let btnY = cardY + cardH - 90;
  
  // 檢測滑鼠是否懸停在按鈕上方
  let isHover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;

  // 依據滑鼠懸停狀態改變按鈕顏色
  fill(isHover ? color(230, 57, 70) : color(29, 53, 87));
  noStroke();
  rect(btnX, btnY, btnW, btnH, 10);

  // 繪製按鈕上的文字
  fill(255);
  textSize(18);
  textStyle(BOLD);
  text("開始測驗", width / 2, btnY + btnH / 2);
}

// 繪製頂部標題、品牌介紹與價格資訊 UI
function drawHeaderUI() {
  fill(29, 53, 87); 
  textAlign(CENTER, TOP); 
  
  // 繪製主標題
  textSize(24); 
  textStyle(BOLD); 
  text("台灣常見汽車品牌拼圖教學測驗", width / 2, 12); 
  
  // 繪製當前關卡名稱
  textSize(16); 
  textStyle(BOLD); 
  fill(230, 57, 70); 
  let levelText = `第 ${currentLevel + 1} / 3 關：${questionsData[currentLevel].brand}`; 
  text(levelText, width / 2, 42); 

  // 繪製該汽車品牌的介紹與參考價格
  textSize(14);
  textStyle(NORMAL);
  fill(29, 53, 87);
  let infoText = `【參考價格】：${questionsData[currentLevel].price}   |   ${questionsData[currentLevel].intro}`;
  text(infoText, width / 2, 66);
}

// 繪製左側目標拼圖板 (半透明原圖底板)
function drawLeftBoard() {
  if (boardCells.length === 0) return; // 若無格子資料則跳過
  
  let boardX = boardCells[0].x; 
  let boardY = boardCells[0].y; 
  let boardW = boardCells[2].w * 3; 
  let boardH = boardCells[8].h * 3; 
  
  // 繪製板塊上方提示文字
  fill(29, 53, 87); 
  textSize(15); 
  textStyle(BOLD);
  textAlign(CENTER, BOTTOM); 
  text("【對應拼圖板 (半透明原圖)】", boardX + boardW / 2, boardY - 8); 
  
  // 繪製帶有透明度的汽車背景原圖作為拼圖提示
  if (currentImg) { 
    tint(255, 95); 
    image(currentImg, boardX, boardY, boardW, boardH); 
    noTint(); 
  }
  
  // 繪製 3x3 目標框架的外框線條
  stroke(29, 53, 87, 120); 
  strokeWeight(2); 
  noFill(); 
  rect(boardX, boardY, boardW, boardH, 4); 
  
  // 繪製內部 9 個格子的虛線外框
  stroke(29, 53, 87, 50); 
  strokeWeight(1); 
  for (let r = 0; r < 3; r++) { 
    for (let c = 0; c < 3; c++) { 
      let cell = boardCells[r * 3 + c]; 
      rect(cell.x, cell.y, cell.w, cell.h); 
    }
  }
  
  // 繪製所有已經成功吸附對齊到正確位置的拼圖塊
  for (let p of pieces) { 
    if (p.isSnapped) { 
      drawSquarePiece(p); 
    }
  }
}

// 繪製右側散落拼圖區
function drawRightArea() {
  if (boardCells.length === 0) return;
  let halfWidth = width / 2; 
  let boardY = boardCells[0].y; 
  
  // 繪製右側區域上方提示文字
  fill(29, 53, 87); 
  textSize(15); 
  textStyle(BOLD);
  textAlign(CENTER, BOTTOM); 
  text("【拖曳拼圖區 (正方形)】", halfWidth + (width - halfWidth) / 2, boardY - 8); 
  
  // 繪製所有尚未吸附、仍在右側的拼圖塊
  for (let p of pieces) { 
    if (!p.isSnapped) { 
      drawSquarePiece(p); 
    }
  }
}

// 繪製單個正方形拼圖塊
function drawSquarePiece(p) {
  push(); // 儲存當前繪製狀態
  translate(p.x, p.y); // 將座標原點移動至拼圖當前位置
  
  // 根據拼圖在九宮格中的行列位置，從原圖切片對應局部畫面並繪製
  if (currentImg) { 
    let sx = (p.col / 3) * currentImg.width;  // 計算切片來源 X 座標
    let sy = (p.row / 3) * currentImg.height; // 計算切片來源 Y 座標
    let sw = currentImg.width / 3;            // 計算切片寬度
    let sh = currentImg.height / 3;           // 計算切片高度
    
    image(currentImg, 0, 0, p.w, p.h, sx, sy, sw, sh); // 繪製圖片切片
  }
  
  // 繪製正方形拼圖的白色立體邊框
  stroke(255, 255, 255, 230); 
  strokeWeight(2); 
  noFill(); 
  rect(0, 0, p.w, p.h); 
  
  // 繪製深色邊框增強層次感
  stroke(29, 53, 87, 60); 
  strokeWeight(1); 
  rect(0, 0, p.w, p.h); 
  
  pop(); // 恢復繪製狀態
}

// 繪製單關完成成功的提示橫幅
function drawLevelClearBanner() {
  fill(29, 53, 87, 230); // 繪製半透明深藍色背景條
  rect(0, height / 2 - 50, width, 100); 
  
  fill(255); 
  textAlign(CENTER, CENTER); 
  textSize(26); 
  textStyle(BOLD); 
  text(`🎉 恭喜完成【${questionsData[currentLevel].brand}】拼圖！`, width / 2, height / 2 - 10); 
  
  textSize(15); 
  textStyle(NORMAL); 
  text("點擊畫布任意處進入下一關...", width / 2, height / 2 + 25); 
}

// ==========================================
// 最終結算與煙火特效 (Game Over & Fireworks)
// ==========================================

function drawGameOverScreen() {
  // 以一定機率隨機產生新的煙火物件
  if (random(1) < 0.08) { 
    fireworks.push(new Firework()); 
  }
  
  // 更新並繪製所有的煙火粒子
  for (let i = fireworks.length - 1; i >= 0; i--) { 
    fireworks[i].update(); 
    fireworks[i].show();    
    if (fireworks[i].done()) { 
      fireworks.splice(i, 1); // 煙火結束後從陣列中移除
    }
  }
  
  let cardW = min(560, width * 0.9); // 結算卡片寬度
  let cardH = 440;                    // 結算卡片高度
  let cardX = (width - cardW) / 2;    // 結算卡片置中 X
  let cardY = (height - cardH) / 2;   // 結算卡片置中 Y
  
  // 繪製結算面板背景外框
  fill(255, 255, 255, 240); 
  stroke(29, 53, 87); 
  strokeWeight(3); 
  rect(cardX, cardY, cardW, cardH, 20); 
  
  // 繪製通關恭喜標題
  fill(230, 57, 70); 
  textAlign(CENTER, TOP); 
  textSize(28); 
  textStyle(BOLD); 
  text("🏆 恭喜完成全部三關拼圖挑戰！", width / 2, cardY + 30); 
  
  // 繪製總耗時統計文字
  fill(29, 53, 87); 
  textSize(18); 
  textStyle(NORMAL); 
  text(`總共花費時間：${totalElapsedTime} 秒`, width / 2, cardY + 75); 
  
  // 繪製三關成績九宮格徽章的排版參數
  let gridStartY = cardY + 120; 
  let gridCellW = 140; 
  let gridCellH = 90;  
  let gap = 15;        
  let totalGridW = 3 * gridCellW + 2 * gap; 
  let startX = (width - totalGridW) / 2; 
  
  // 迴圈繪製三關各自的通關徽章
  for (let i = 0; i < 3; i++) { 
    let gx = startX + i * (gridCellW + gap); 
    
    fill(241, 245, 249); 
    stroke(148, 163, 184); 
    strokeWeight(1); 
    rect(gx, gridStartY, gridCellW, gridCellH, 10); 
    
    fill(29, 53, 87); 
    textSize(14); 
    textStyle(BOLD); 
    text(`第 ${i + 1} 關`, gx + gridCellW / 2, gridStartY + 12); 
    
    textSize(12); 
    textStyle(NORMAL); 
    fill(69, 123, 157); 
    text(questionsData[i].brand.split(" ")[0], gx + gridCellW / 2, gridStartY + 35); 
    
    fill(16, 185, 129); 
    textStyle(BOLD);
    text("通關完成 ✔", gx + gridCellW / 2, gridStartY + 62); 
  }
  
  // 繪製重新挑戰提示文字
  fill(69, 123, 157); 
  textSize(15); 
  textStyle(NORMAL);
  text("按下 [ F5 ] 或重新整理網頁即可重新挑戰！", width / 2, cardY + cardH - 40); 
}

// ==========================================
// 使用者互動控制 (Mouse Events)
// ==========================================

function mousePressed() {
  // 1. 若處於首頁狀態：檢測是否點擊「開始測驗」按鈕
  if (gameState === "START") {
    let cardW = min(500, width * 0.85);
    let cardH = 300;
    let cardY = (height - cardH) / 2;
    let btnW = 180;
    let btnH = 50;
    let btnX = width / 2 - btnW / 2;
    let btnY = cardY + cardH - 90;

    if (mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH) {
      gameState = "PLAYING";      // 切換狀態為遊玩中
      startTime = millis();       // 記錄遊戲正式開始的毫秒時間
      
      // 當點擊「開始測驗」時，自動播放背景音樂檔
      if (bgmMusic && !bgmMusic.isPlaying()) {
        bgmMusic.loop();          // 設定為循環播放
      }
    }
    return;
  }

  // 2. 若處於單關完成狀態：點擊畫布任意處切換至下一關
  if (gameState === "LEVEL_CLEAR") { 
    currentLevel++; // 關卡索引遞增
    if (currentLevel < questionsData.length) { 
      gameState = "PLAYING"; 
      loadLevelImage(currentLevel); // 載入下一關圖片
    } else { 
      gameState = "GAME_OVER"; // 若三關全數通關，切換至結算畫面
      totalElapsedTime = floor((millis() - startTime) / 1000); // 計算總耗時 (秒)
    }
    return; 
  }
  
  // 3. 一般遊玩狀態：點擊並選取要拖曳的拼圖塊
  if (gameState === "PLAYING") { 
    // 由上往下（從陣列尾端向前）檢查，確保優先選取最上層的拼圖
    for (let i = pieces.length - 1; i >= 0; i--) { 
      let p = pieces[i]; 
      
      if (p.isSnapped) continue; // 若該拼圖已經吸附定位，則不可再拖曳
      
      // 檢測滑鼠是否點擊在該拼圖範圍內
      if (mouseX > p.x && mouseX < p.x + p.w &&
          mouseY > p.y && mouseY < p.y + p.h) { 
          
        draggedPiece = p;               // 記錄被拖曳的拼圖
        offsetX = mouseX - p.x;         // 記錄滑鼠點擊處與拼圖左上角的 X 偏移
        offsetY = mouseY - p.y;         // 記錄滑鼠點擊處與拼圖左上角的 Y 偏移
        
        // 將被選取的拼圖從陣列中抽離並移至最末端，使其繪製在最上層
        pieces.splice(i, 1); 
        pieces.push(p);     
        break; 
      }
    }
  }
}

// 滑鼠拖曳中觸發函式 (mouseDragged)
function mouseDragged() {
  if (draggedPiece) { 
    draggedPiece.x = mouseX - offsetX; // 更新拼圖跟隨滑鼠移動的 X 座標
    draggedPiece.y = mouseY - offsetY; // 更新拼圖跟隨滑鼠移動的 Y 座標
  }
}

// 滑鼠放開時觸發函式 (mouseReleased)
function mouseReleased() {
  if (draggedPiece) { 
    let distanceThreshold = 45; // 設定吸附的極限距離門檻 (像素)
    // 計算當前拼圖位置與正確目標位置之間的距離
    let d = dist(draggedPiece.x, draggedPiece.y, draggedPiece.targetX, draggedPiece.targetY); 
    
    // 若距離小於門檻值，則自動吸附對齊；否則放開留在原處
    if (d < distanceThreshold) { 
      draggedPiece.x = draggedPiece.targetX; 
      draggedPiece.y = draggedPiece.targetY; 
      draggedPiece.isSnapped = true; // 標記為已成功吸附定位          
    } else {
      draggedPiece.isSnapped = false; 
    }
    
    draggedPiece = null;     // 清除拖曳物件狀態
    checkLevelCompletion();  // 檢查是否所有拼圖皆已拼完
  }
}

// 檢查當前關卡是否全部拼好
function checkLevelCompletion() {
  let allSnapped = pieces.every(p => p.isSnapped); // 檢查是否全部拼圖的 isSnapped 皆為 true
  if (allSnapped) { 
    gameState = "LEVEL_CLEAR"; // 若全數完成，切換狀態為單關通關
  }
}

// ==========================================
// 煙火特效粒子系統 (Firework Particle System)
// ==========================================

// 煙火大物件類別
class Firework {
  constructor() {
    this.x = random(width * 0.1, width * 0.9); // 隨機煙火發射水平位置
    this.firework = new Particle(this.x, height, true); // 建立升空種子粒子
    this.exploded = false; // 標記是否已爆炸
    this.particles = [];    // 存放爆炸後的絢麗小粒子陣列
  }
  
  update() {
    if (!this.exploded) { 
      this.firework.applyForce(createVector(0, 0.2)); // 給予重力加速度
      this.firework.update(); 
      
      // 當煙火上升速度歸零或向下時觸發爆炸
      if (this.firework.vel.y >= 0) { 
        this.exploded = true; 
        this.explode();        
      }
    }
    
    // 更新所有爆炸後的小粒子
    for (let i = this.particles.length - 1; i >= 0; i--) { 
      this.particles[i].applyForce(createVector(0, 0.15)); // 粒子受重力影響
      this.particles[i].update(); 
      if (this.particles[i].done()) { 
        this.particles.splice(i, 1); // 壽命結束後移除
      }
    }
  }
  
  explode() {
    let particleCount = 65; // 爆炸產生的粒子數量
    let hu = random(255);    // 隨機色相
    for (let i = 0; i < particleCount; i++) { 
      let p = new Particle(this.firework.pos.x, this.firework.pos.y, false, hu); 
      this.particles.push(p); 
    }
  }
  
  done() {
    return this.exploded && this.particles.length === 0; // 判定煙火是否完全結束
  }
  
  show() {
    if (!this.exploded) { 
      this.firework.show(); // 顯示上升軌跡
    }
    for (let p of this.particles) { 
      p.show(); // 顯示爆炸粒子
    }
  }
}

// 單一粒子類別
class Particle {
  constructor(x, y, isSeed, hueVal) {
    this.pos = createVector(x, y); // 粒子位置向量
    this.isSeed = isSeed;          // 是否為上升中的種子粒子
    this.lifespan = 255;            // 粒子生命週期透明度
    
    if (this.isSeed) { 
      this.vel = createVector(0, random(-14, -18)); // 種子向上速度
    } else { 
      this.vel = p5.Vector.random2D(); // 爆炸粒子四散的隨機方向
      this.vel.mult(random(2, 10));    // 爆炸擴散速度大小
    }
    this.acc = createVector(0, 0);       // 加速度向量
    this.color = hueVal || random(255);  // 粒子顏色色相
  }
  
  applyForce(force) {
    this.acc.add(force); // 套用外力（如重力）
  }
  
  update() {
    if (!this.isSeed) { 
      this.vel.mult(0.92); // 爆炸粒子受空氣阻力減速
      this.lifespan -= 4;  // 隨時間遞減生命週期
    }
    this.vel.add(this.acc); // 速度加上加速度
    this.pos.add(this.vel); // 位置加上速度
    this.acc.mult(0);       // 重置加速度
  }
  
  done() {
    return this.lifespan < 0; // 檢查粒子是否完全消失
  }
  
  show() {
    colorMode(HSB, 255); // 切換為 HSB 色彩模式以繪製鮮豔煙火
    if (this.isSeed) { 
      strokeWeight(6); 
      stroke(this.color, 255, 255); 
    } else { 
      strokeWeight(4); 
      stroke(this.color, 255, 255, this.lifespan); // 伴隨透明度漸漸淡出
    }
    point(this.pos.x, this.pos.y); // 繪製粒子點
    colorMode(RGB, 255); // 還原為預設的 RGB 色彩模式
  }
}