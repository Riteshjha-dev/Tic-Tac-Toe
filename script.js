(function(){
  // ================= Element refs =================
  const boardEl = document.getElementById('board');
  const gridOverlay = document.getElementById('gridOverlay');
  const statusEl = document.getElementById('status');
  const modeFriendBtn = document.getElementById('modeFriend');
  const modeCPUBtn = document.getElementById('modeCPU');
  const diffRow = document.getElementById('diffRow');
  const nameRow = document.getElementById('nameRow');
  const nameXInput = document.getElementById('nameX');
  const nameOInput = document.getElementById('nameO');
  const nameOLabel = document.getElementById('nameOLabel');
  const scoreLabelX = document.getElementById('scoreLabelX');
  const scoreLabelO = document.getElementById('scoreLabelO');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreDEl = document.getElementById('scoreD');
  const scoreCardX = document.querySelector('.score-card.x');
  const scoreCardO = document.querySelector('.score-card.o');
  const scoreCardD = document.querySelector('.score-card.d');
  const newRoundBtn = document.getElementById('newRoundBtn');
  const resetBtn = document.getElementById('resetBtn');
  const muteBtn = document.getElementById('muteBtn');
  const confettiLayer = document.getElementById('confettiLayer');

  const WIN_LINES = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  const STORAGE_KEY = 'chalkTacToeState';

  // ================= State =================
  let mode = 'friend';       // 'friend' | 'cpu'
  let difficulty = 'medium'; // easy | medium | hard
  let board = Array(9).fill(null);
  let current = 'X';
  let starter = 'X';
  let gameOver = false;
  let cells = [];
  let scores = { X:0, O:0, D:0 };
  let muted = false;
  let names = { X:'Player X', O:'Player O' };

  // ================= Persistence =================
  function saveState(){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ mode, difficulty, scores, names, muted }));
    }catch(e){}
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return;
      const saved = JSON.parse(raw);
      if(saved.mode) mode = saved.mode;
      if(saved.difficulty) difficulty = saved.difficulty;
      if(saved.scores) scores = saved.scores;
      if(saved.names) names = saved.names;
      if(typeof saved.muted === 'boolean') muted = saved.muted;
    }catch(e){}
  }

  // ================= Audio (tiny synthesized blips, no files needed) =================
  let audioCtx = null;
  function beep(freq, dur, type){
    if(muted) return;
    try{
      if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type || 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + dur);
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + dur);
    }catch(e){}
  }
  muteBtn.addEventListener('click', ()=>{
    muted = !muted;
    muteBtn.textContent = muted ? '🔇' : '🔊';
    saveState();
  });

  // ================= Board building =================
  function buildCells(){
    boardEl.querySelectorAll('.cell, .dust-mote').forEach(c=>c.remove());
    cells = [];
    for(let i=0;i<9;i++){
      const btn = document.createElement('button');
      btn.className = 'cell';
      btn.setAttribute('aria-label', 'Cell ' + (i+1));
      btn.dataset.idx = i;
      btn.innerHTML = ghostMarkSVG();
      btn.addEventListener('click', ()=>onCellClick(i));
      btn.addEventListener('keydown', (e)=>onCellKeydown(e, i));
      boardEl.appendChild(btn);
      cells.push(btn);
    }
    spawnDustMotes();
  }

  function ghostMarkSVG(){
    return '<svg class="mark ghost" viewBox="0 0 100 100"><path d="M28,28 L72,72 M72,28 L28,72" stroke="currentColor" stroke-width="10" style="color:var(--chalk-white)"/></svg>';
  }

  function drawGrid(){
    gridOverlay.innerHTML = `
      <g stroke="var(--line)" stroke-width="3.4" stroke-linecap="round" filter="url(#chalkRough)" opacity="0.55">
        <path d="M100,6 C102,60 98,140 101,196 C103,240 99,270 100,294" fill="none"/>
        <path d="M200,4 C198,55 202,150 199,205 C197,250 201,268 200,296" fill="none"/>
        <path d="M6,100 C60,102 150,97 205,101 C250,103 270,98 294,100" fill="none"/>
        <path d="M4,200 C55,198 150,203 205,199 C250,197 268,202 296,200" fill="none"/>
      </g>
      <g id="winLineGroup"></g>
    `;
  }

  // ambient chalk dust motes gently drifting inside the board (restrained, low opacity)
  function spawnDustMotes(){
    const count = 7;
    for(let i=0;i<count;i++){
      const mote = document.createElement('div');
      mote.className = 'dust-mote';
      mote.style.left = (8 + Math.random()*84) + '%';
      mote.style.top = (30 + Math.random()*60) + '%';
      mote.style.animationDuration = (6 + Math.random()*5) + 's';
      mote.style.animationDelay = (Math.random()*6) + 's';
      boardEl.appendChild(mote);
    }
  }

  // keyboard grid navigation: arrow keys move focus, Enter/Space place mark (native)
  function onCellKeydown(e, idx){
    const row = Math.floor(idx/3), col = idx%3;
    let target = null;
    if(e.key === 'ArrowRight') target = row*3 + ((col+1)%3);
    else if(e.key === 'ArrowLeft') target = row*3 + ((col+2)%3);
    else if(e.key === 'ArrowDown') target = ((row+1)%3)*3 + col;
    else if(e.key === 'ArrowUp') target = ((row+2)%3)*3 + col;
    if(target !== null){
      e.preventDefault();
      cells[target].focus();
    }
  }

  // ================= Game flow =================
  function resetRound(){
    board = Array(9).fill(null);
    current = starter;
    gameOver = false;
    buildCells();
    drawGrid();
    updateStatus();
  }

  function newMatch(resetScores){
    if(resetScores){
      scores = { X:0, O:0, D:0 };
      saveState();
    }
    updateScoreboard();
    starter = 'X';
    resetRound();
  }

  function displayName(mark){
    if(mode === 'cpu' && mark === 'O') return 'Computer';
    return names[mark] || ('Player ' + mark);
  }

  function updateStatus(thinking){
    if(gameOver) return;
    statusEl.innerHTML = `Turn: <span class="mark-${current.toLowerCase()}">${current}</span>` +
      (thinking ? ` <span class="thinking-dots"><span></span><span></span><span></span></span>` : ` — ${displayName(current)}`);
  }

  function updateScoreboard(){
    scoreXEl.textContent = scores.X;
    scoreOEl.textContent = scores.O;
    scoreDEl.textContent = scores.D;
    scoreLabelX.textContent = names.X;
    scoreLabelO.textContent = displayName('O');
  }

  function pulseCard(card){
    card.classList.add('pulse');
    setTimeout(()=>card.classList.remove('pulse'), 400);
  }

  function onCellClick(idx){
    if(gameOver || board[idx]) return;
    if(mode === 'cpu' && current === 'O') return;
    placeMark(idx, current);
  }

  function placeMark(idx, mark){
    board[idx] = mark;
    renderMark(idx, mark);
    beep(mark === 'X' ? 440 : 330, 0.12, 'triangle');

    const result = evaluateBoard(board);
    if(result){
      handleGameEnd(result);
      return;
    }
    current = current === 'X' ? 'O' : 'X';
    updateStatus();

    if(!gameOver && mode === 'cpu' && current === 'O'){
      updateStatus(true);
      lockBoard(true);
      setTimeout(()=>{
        lockBoard(false);
        const move = getCPUMove(board, difficulty);
        if(move !== null && !gameOver) placeMark(move, 'O');
      }, 420 + Math.random()*380);
    }
  }

  function lockBoard(locked){
    cells.forEach(c=>{ if(!board[c.dataset.idx]) c.disabled = locked; });
  }

  function renderMark(idx, mark){
    const cell = cells[idx];
    cell.disabled = true;
    cell.innerHTML = mark === 'X' ? xMarkSVG() : oMarkSVG();
    const svgMark = cell.querySelector('svg.mark');
    requestAnimationFrame(()=>svgMark.classList.add('draw'));
  }

  function xMarkSVG(){
    return `<svg class="mark" viewBox="0 0 100 100">
      <path d="M26,26 L74,74" stroke="var(--chalk-coral)" stroke-width="11" filter="url(#chalkRough)"
        stroke-dasharray="68" style="--len:68"/>
      <path d="M74,26 L26,74" stroke="var(--chalk-coral)" stroke-width="11" filter="url(#chalkRough)"
        stroke-dasharray="68" style="--len:68"/>
    </svg>`;
  }
  function oMarkSVG(){
    return `<svg class="mark" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="27" stroke="var(--chalk-teal)" stroke-width="11" filter="url(#chalkRough)"
        stroke-dasharray="170" style="--len:170"/>
    </svg>`;
  }

  function evaluateBoard(b){
    for(const line of WIN_LINES){
      const [a,b1,c] = line;
      if(b[a] && b[a]===b[b1] && b[a]===b[c]){
        return { winner:b[a], line };
      }
    }
    if(b.every(v=>v)) return { winner:null, line:null };
    return null;
  }

  function handleGameEnd(result){
    gameOver = true;
    if(result.winner){
      scores[result.winner]++;
      highlightWin(result.line);
      statusEl.innerHTML = `<span class="mark-${result.winner.toLowerCase()}">${result.winner}</span> — ${displayName(result.winner)} wins the round! 🎉`;
      beep(result.winner === 'X' ? 523 : 392, 0.3, 'sine');
      pulseCard(result.winner === 'X' ? scoreCardX : scoreCardO);
      launchConfetti(result.winner);
    } else {
      scores.D++;
      statusEl.textContent = "It's a draw — board's full!";
      beep(220, 0.25, 'sine');
      pulseCard(scoreCardD);
    }
    updateScoreboard();
    lockBoard(true);
    saveState();
  }

  function highlightWin(line){
    line.forEach(i=>cells[i].classList.add('win-cell'));
    const pts = line.map(i=>{
      const row = Math.floor(i/3), col = i%3;
      return { x: col*100+50, y: row*100+50 };
    });
    const path = `M${pts[0].x},${pts[0].y} L${pts[2].x},${pts[2].y}`;
    const g = document.getElementById('winLineGroup');
    g.innerHTML = `<path d="${path}" stroke="var(--chalk-yellow)" stroke-width="9" stroke-linecap="round"
      filter="url(#chalkRough)" stroke-dasharray="220" style="--len:220" class="win-draw"/>`;
    const p = g.querySelector('path');
    p.style.strokeDashoffset = 220;
    requestAnimationFrame(()=>{
      p.style.transition = 'stroke-dashoffset .45s ease';
      p.style.strokeDashoffset = 0;
    });
  }

  // small chalk-colored confetti burst celebrating the winner
  function launchConfetti(winner){
    const color = winner === 'X' ? '#ff7a68' : '#5fd9c9';
    const secondary = '#ffd873';
    const count = 42;
    for(let i=0;i<count;i++){
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = (Math.random()*100) + 'vw';
      piece.style.background = Math.random() < 0.7 ? color : secondary;
      piece.style.animationDuration = (1.6 + Math.random()*1.2) + 's';
      piece.style.animationDelay = (Math.random()*0.3) + 's';
      piece.style.borderRadius = Math.random() < 0.5 ? '50%' : '2px';
      confettiLayer.appendChild(piece);
      setTimeout(()=>piece.remove(), 3200);
    }
  }

  // ================= CPU AI =================
  function getCPUMove(b, diff){
    const empties = b.reduce((acc,v,i)=>{ if(!v) acc.push(i); return acc; }, []);
    if(empties.length === 0) return null;

    if(diff === 'easy'){
      return empties[Math.floor(Math.random()*empties.length)];
    }
    if(diff === 'medium'){
      const winMove = findWinningMove(b, 'O');
      if(winMove !== null) return winMove;
      const blockMove = findWinningMove(b, 'X');
      if(blockMove !== null) return blockMove;
      if(Math.random() < 0.55) return empties[Math.floor(Math.random()*empties.length)];
      return minimaxMove(b, 'O');
    }
    return minimaxMove(b, 'O');
  }

  function findWinningMove(b, mark){
    for(const line of WIN_LINES){
      const vals = line.map(i=>b[i]);
      const countMark = vals.filter(v=>v===mark).length;
      const countEmpty = vals.filter(v=>!v).length;
      if(countMark === 2 && countEmpty === 1){
        return line[vals.findIndex(v=>!v)];
      }
    }
    return null;
  }

  function minimaxMove(b, mark){
    let bestScore = -Infinity;
    let bestMove = null;
    const opponent = mark === 'O' ? 'X' : 'O';
    for(let i=0;i<9;i++){
      if(!b[i]){
        b[i] = mark;
        const score = minimax(b, 0, false, mark, opponent);
        b[i] = null;
        if(score > bestScore){ bestScore = score; bestMove = i; }
      }
    }
    return bestMove;
  }

  function minimax(b, depth, isMax, aiMark, humMark){
    const result = evaluateBoard(b);
    if(result){
      if(result.winner === aiMark) return 10 - depth;
      if(result.winner === humMark) return depth - 10;
      return 0;
    }
    if(isMax){
      let best = -Infinity;
      for(let i=0;i<9;i++){
        if(!b[i]){
          b[i] = aiMark;
          best = Math.max(best, minimax(b, depth+1, false, aiMark, humMark));
          b[i] = null;
        }
      }
      return best;
    } else {
      let best = Infinity;
      for(let i=0;i<9;i++){
        if(!b[i]){
          b[i] = humMark;
          best = Math.min(best, minimax(b, depth+1, true, aiMark, humMark));
          b[i] = null;
        }
      }
      return best;
    }
  }

  // ================= Mode / difficulty / name controls =================
  function applyModeUI(){
    if(mode === 'cpu'){
      modeCPUBtn.classList.add('active'); modeCPUBtn.setAttribute('aria-selected','true');
      modeFriendBtn.classList.remove('active'); modeFriendBtn.setAttribute('aria-selected','false');
      diffRow.classList.add('show');
      nameOLabel.textContent = 'Player O';
      nameOInput.disabled = true;
      nameOInput.placeholder = 'Computer';
    } else {
      modeFriendBtn.classList.add('active'); modeFriendBtn.setAttribute('aria-selected','true');
      modeCPUBtn.classList.remove('active'); modeCPUBtn.setAttribute('aria-selected','false');
      diffRow.classList.remove('show');
      nameOLabel.textContent = 'Player O';
      nameOInput.disabled = false;
      nameOInput.placeholder = 'Player O';
    }
    diffRow.querySelectorAll('button').forEach(b=>{
      b.classList.toggle('active', b.dataset.diff === difficulty);
    });
  }

  modeFriendBtn.addEventListener('click', ()=>{
    if(mode === 'friend') return;
    mode = 'friend';
    applyModeUI();
    saveState();
    newMatch(true);
  });
  modeCPUBtn.addEventListener('click', ()=>{
    if(mode === 'cpu') return;
    mode = 'cpu';
    applyModeUI();
    saveState();
    newMatch(true);
  });
  diffRow.querySelectorAll('button').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      diffRow.querySelectorAll('button').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      difficulty = btn.dataset.diff;
      saveState();
      newMatch(true);
    });
  });

  nameXInput.addEventListener('input', ()=>{
    names.X = nameXInput.value.trim() || 'Player X';
    updateScoreboard();
    if(!gameOver) updateStatus();
    saveState();
  });
  nameOInput.addEventListener('input', ()=>{
    names.O = nameOInput.value.trim() || 'Player O';
    updateScoreboard();
    if(!gameOver) updateStatus();
    saveState();
  });

  newRoundBtn.addEventListener('click', ()=>{
    starter = starter === 'X' ? 'O' : 'X';
    resetRound();
    if(mode === 'cpu' && current === 'O' && !gameOver){
      updateStatus(true);
      lockBoard(true);
      setTimeout(()=>{
        lockBoard(false);
        const move = getCPUMove(board, difficulty);
        if(move !== null) placeMark(move, 'O');
      }, 420);
    }
  });
  resetBtn.addEventListener('click', ()=>newMatch(true));

  // ================= Init =================
  loadState();
  nameXInput.value = names.X === 'Player X' ? '' : names.X;
  nameOInput.value = names.O === 'Player O' ? '' : names.O;
  muteBtn.textContent = muted ? '🔇' : '🔊';
  applyModeUI();
  newMatch(false);
})();
