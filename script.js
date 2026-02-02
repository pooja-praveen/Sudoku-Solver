const qs  =(sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));

const boardEl = qs('#sudoku-board');
let cells = [];
//--------------CREATE BORD----------------//
function createboard(){
    boardEl.innerHTML = '';
    cells = [];
    for(let r = 0; r < 9; r++){
        for(let c = 0; c < 9; c++){
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.className = 'cell';
            input.dataset.row = r;
            input.dataset.col = c;
            input.dataset.box = Math.floor(r / 3) * 3 + Math.floor(c / 3);
            input.autocomplete = 'off';

            input.addEventListener('input',onCellInput);
            input.addEventListener('keydown',onCellKeyDown);
            input.addEventListener('focus',onCellFocus);

            boardEl.appendChild(input);
            cells.push(input);    

        }
    }
    addThickBorders();
}

//--------------EXTRA GRID BORDER----------------//
function addThickBorders(){
    const all = qsa('#sudoku-board .cell');
    all.forEach((el) => {
        const r = parseInt(el.dataset.row, 10);
        const c = parseInt(el.dataset.col, 10);

        if(c % 3 === 2 && c !== 8)
            el.style.borderRight = '2px solid rgba(2,6,23,0.18)';
        if(r % 3 === 2 && r !== 8)
            el.style.borderBottom = '2px solid rgba(2,6,23,0.18)';
    });
}

//--------------INPUT HANDLERS----------------//
function onCellInput(e){
    const val = e.target.value.replace(/[^1-9]/g,'');
    e.target.value = val;
    e.target.classList.remove('error');  
}

function onCellKeyDown(e){
    if(e.key === 'Backspace' || e.key == 'Delete'){
        e.target.value = '';
        e.preventDefault();
    }
    //allow navigation with arrow keys
    const r = parseInt(e.target.dataset.row, 10);
    const c = parseInt(e.target.dataset.col, 10);
    if(e.key === 'ArrowRight') focusCell(r, c + 1);
    if(e.key === 'ArrowLeft') focusCell(r, c - 1);
    if(e.key === 'ArrowUp') focusCell(r-1, c);
    if(e.key === 'ArrowDown') focusCell(r+1,c);
    }

    function onCellFocus(e){
       const r = parseInt(e.target.dataset.row, 10);
       const c = parseInt(e.target.dataset.col, 10);
       qsa('.cell').forEach((cell) => (cell.style.boxShadow = 'none'));
       qsa(
         `.cell[data-row='${r}'], .cell[data-col='${c}'], .cell[data-box='${e.target.dataset.box}']`
       ).forEach((cell) => {
         cell.style.boxShadow = 'inset 0 0 0 2px rgba(96,165,250,0.06)';
        }); 
    }

    function focusCell(r, c) {
       if(r < 0 ||r > 8 || c < 0 || c > 8) return;
        const idx = r * 9 + c;
        cells[idx].focus();
    }

    //--------------READ & WRITE----------------//
    function readBoard(){
        const board =[];
        for (let r =0; r < 9; r++){
            const row = [];
            for(let c = 0; c < 9; c++){
                const val =cells[r * 9 + c].value.trim();
                row.push(val === '' ? 0 : parseInt(val, 10));
            }
            board.push(row);
        }
        return board;
    }
    
    function writeBoard(board, markReadonly = true) {
        for(let r = 0; r < 9; r++){
            for(let c = 0; c < 9; c++){
                const el = cells[ r * 9 + c];
                const v = board[r][c];
                el.value = v === 0 ? '' : String(v);
                el.classList.remove('readonly'); // Remove first
                el.readOnly = false; // Allow editing by default
                if(markReadonly){
                    if(v !== 0 ){
                        el.classList.add('readonly');
                        el.readOnly = true;//still removeable
                    }
                }
                el.classList.remove('error');
            }
        }
    }

    //--------------VALIDATE----------------//
    function validateBoard(board){
        const conflicts = [];
        //check rows
        for(let r = 0; r < 9; r++){
            const seen = {};
            for(let c = 0; c < 9; c++){
                const v = board[r][c];
                if(v === 0) continue;
                if(seen[v]){
                    conflicts.push([r,c]);
                }
                else seen[v] = true;
            }
        }
          //check cols
          for(let c = 0; c < 9; c++){
            const seen = {};
            for(let r = 0; r < 9; r++){
                const v = board[r][c];
                if(v === 0) continue;
                if(seen[v]){
                    conflicts.push([r,c]);
                }
                else seen[v] = true;
            }
          }
          return conflicts;
    }

    function showConflicts(conflicts){
        qsa('.cell').forEach((el) => el.classList.remove('error'));
        conflicts.forEach(([r, c]) => {
            const el = cells[r * 9 + c];
            el.classList.add('error');
        });
    }

    //--------------SOLVER----------------//
    function isSafe(board, row, col, num){
        for(let x = 0;x < 9; x++) if (board[row][x] === num) return false;
        for(let x = 0;x < 9; x++) if (board[x][col] === num) return false;
        const startRow = row - (row % 3),
        startCol = col - (col % 3);
         for(let r = 0; r < 3; r++){
            for(let c = 0; c < 3; c++){
                if(board[startRow + r][startCol + c] === num) return false;
            }
        }
        return true;
    }

    function findEmpty(board){
        for(let r = 0; r < 9; r++){
            for(let c = 0; c < 9; c++){
                if(board[r][c] === 0) return [r, c];
            }
        }
        return null;
    }

    function solveBoard(board){
        const empty = findEmpty(board);
        if(!empty ) return true;
        const [r, c] = empty;
        for(let num = 1; num <= 9; num++){
            if(isSafe(board, r, c, num)) {
                board[r][c] = num;
                if(solveBoard(board)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }

    //-----------------BUTTON HANDLERS-----------------//
    function onSolve(){
        const board = readBoard();
        const conflicts = validateBoard(board);
        if(conflicts.length ){
            showConflicts(conflicts);
            alert('The board has conflicts. Please fix them before solving.');
            return;
        }
        const copy = board.map((r) => r.slice());
        const ok = solveBoard(copy);
        if(ok){
            writeBoard(copy, false);
        }
        else{
            alert('The board cannot be solved.plase check your input');
        }
    }

    function onClear(){
       qsa('.cell').forEach((el) => {
        el.value = '';
        el.classList.remove('readonly','error');
       });
    }

    function onValidate(){
        const board = readBoard();
        const conflicts = validateBoard(board);
        showConflicts(conflicts);
        if(conflicts.length) alert('The board has conflicts. Please fix them.');
        else alert('The board is validate so far.keep going!');
    }

    //-----------------GENERATE PUZZLE-----------------//
    function shuffle(arr){
        for(let i = arr.lentgh - 1; i > 0; i--){
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function generateFullBoard(){
        const board = Array.from({length: 9}, () => Array(9).fill(0));
        solveBoard(board);
        return board;
    }

    function generatePuzzle(removeIs = 45){
        const full = generateFullBoard();
        const puzzle = full.map((r) => r.slice());
        const positions = [];
        for(let i = 0; i < 81; i++) positions.push(i);
        shuffle(positions);
        for(let k = 0; k < removeIs; k++){
            const pos = positions[k];
            const r = Math.floor(pos / 9);
            const c = pos % 9;
            puzzle[r][c] = 0;
        }
        return puzzle;
    }

    function onGenerate(){
        const puzzle = generatePuzzle(45);
        writeBoard(puzzle, true);
    }

    //-----------------INIT-----------------//
    function bindButtons(){
        qs('#solveBtn').addEventListener('click', onSolve);
        qs('#clearBtn').addEventListener('click', onClear);
        qs('#validateBtn').addEventListener('click', onValidate);
        qs('#generateBtn').addEventListener('click', onGenerate);
    }
    createboard();
    bindButtons();

    //SAMPLE PUZZLE
    const sample = [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ];
    writeBoard(sample, true);