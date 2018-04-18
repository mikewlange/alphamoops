"use strict";

class MoopUi {
    static newGame(size) {
        return {
            turn: MoopBoard.newGame(size),
            side: 1, 
            msg: "Black turn"
        };
    }
    static nextState(state, x, y) {
        if (state.turn.isEnd()) return state;
        if (state.turn.reverseCount(state.side, x, y) === 0) {
            const cur = MoopUi.name(state.side);
            const msg = `${cur} turn again (invalid place)`;
            return {turn: state.turn, side: state.side, msg};
        }

        const turn = state.turn.nextTurn(state.side, x, y);

        if (turn.isEnd()) {
            const b = turn.blacks.length, w = turn.whites.length;
            const r = b === w ? "even" : `${b > w ? "Black" : "White"} win`;
            const msg = `Game End: ${r},  black = ${b} white = ${w}`;
            return {turn, side: state.side, msg};
        }

        const nextPassed = turn.isPass(-state.side);
        const side = nextPassed ? state.side : -state.side;
        const next = MoopUi.name(side), prev = MoopUi.name(-side);
        const tailmsg = nextPassed ? ` (${prev} passed)` : "";
        const msg = `${next} turn${tailmsg}`;
        return {turn, side, msg};
    }
    static name(side) {return side === MoopBoard.BLACK ? "Black" : "White";}
}

// Simple COM player
function comAction(state) {
    return state.turn.blanks.reduce((r, p) => {
        const up = state.turn.reverseCount(state.side, p.x, p.y);
        if (up === 0) return r;
        const next = state.turn.nextTurn(state.side, p.x, p.y);
        const down = next.blanks.reduce((nmax, p) => Math.max(
            next.reverseCount(-state.side, p.x, p.y), nmax), -1);
        const count = up - down;
        return r.count < count ? {count, p} : r;
    }, {count: -Math.pow(state.turn.size, 2), p: null}).p;
}
function comPlay(side, moops) {
    const state = moops.getState();
    if (state.side !== side || state.turn.isEnd()) return;
    setTimeout(_ => {
        const {x, y} = comAction(state);
        moops.dispatch({type: "next", side, x, y});
    }, 500);
}

window.addEventListener("load", _ => {
    const param = /^#(\d+)$/.exec(location.hash);
    const size = param && param[1] >= 4 && param[1] % 2 === 0 ? +param[1] : 8;
    setupStylesheet();
    const main = document.createElement("main");
    document.body.appendChild(main);

    // Redux
    const reducer = (state = MoopUi.newGame(size), action) => {
        switch (action.type) {
        case "new": return MoopUi.newGame(size);
        case "next":
            if (state.side !== action.side) return state;
            return MoopUi.nextState(state, action.x, action.y);
        default: return state;
        }
    };
    const moops = Redux.createStore(reducer);
    // AI spawned from subscribe
    moops.subscribe(() => {
        if (moops.getState().side === MoopBoard.WHITE) {
            comPlay(MoopBoard.WHITE, moops);
        }
    });

    // ReactRedux containers must be wrapped with ReactRedux Provider
    const root = React.createFactory(ReactRedux.Provider)(
        {store: moops},
        React.createFactory(ReversiView)({boardSize: size, cellSize: 50}));
    ReactDOM.render(root, main);
}, false);

// React-Redux View
const ReversiView = ({boardSize, cellSize}) => {
    // ReactRedux Containers: state to props, dispatch to props, and the view
    const msg = ReactRedux.connect(
        ({msg}) => ({msg})
    )(({msg}) => React.DOM.h3({}, msg));
    
    const newgame = ReactRedux.connect(
        null,
        dispatch => ({onClick: () => dispatch({type: "new"})})
    )(({onClick}) => React.DOM.button({onClick}, "New Game"));

    const gameboard = ReactRedux.connect(
        ({turn}) => ({boardSize, cellSize, turn}),
        dispatch => ({onSelect: (x, y) => dispatch(
            {type: "next", side: MoopBoard.BLACK, x, y})})
    )(MoopsBoard);

    return React.DOM.div(
        {},
        React.createFactory(msg)(),
        React.createFactory(gameboard)(),
        React.createFactory(newgame)()
    );
};


// React Views (as state less function component)
const MoopsBoard = ({cellSize, boardSize, turn, onSelect}) => {
    const border = cellSize / 10;
    const span = cellSize + border, edge = border * 2;
    const boardWidth = `${edge + span * boardSize + border}px`;
    const style = {width: boardWidth, height: boardWidth};
    const cells = Array.from(Array(boardSize * boardSize), (_, key) => {
        const x = key % boardSize;
        const y = (key - x) / boardSize;
        const left = `${edge + x * span}px`, top = `${edge + y * span}px`;
        const width = `${cellSize}px`, height = `${cellSize}px`;
        const style = {width, height, left, top};
        const side = turn.gameboard[y][x];
        return CellElement({key, style, x, y, side, onSelect});
    });
    const gameboard = React.DOM.div({className: "board", style}, cells);
    return React.DOM.div({style}, gameboard);
};
//const BoardElement = React.createFactory(MoopsBoard);

const Cell = ({style, x, y, side, onSelect}) => {
    const visibility = side === MoopBoard.BLANK ? "hidden" : "visible";
    const transform = `rotateY(${side === MoopBoard.BLACK ? 0 : 180}deg)`;
    const stoneStyle = {visibility, transform};
    
    const black = React.DOM.div({className: "black"});
    const white = React.DOM.div({className: "white"});
    const stone = React.DOM.div(
        {className: "stone", style: stoneStyle}, black, white);
    return React.DOM.div(
        {className: "cell", style, onClick: () => onSelect(x, y)}, stone);
};
const CellElement = React.createFactory(Cell);

function setupStylesheet() {
    document.head.appendChild(document.createElement("style"));
    const css = document.styleSheets[document.styleSheets.length - 1];
    css.insertRule(`.board {
        position: absolute;
        background-color: #3F51B5;
    }`, 0);
    css.insertRule(`.cell {
        position: absolute;
        background-color: #E91E63;
        box-shadow: -0.1rem -0.1rem rgba(0,0,0,0.6);
    }`, 0);
    css.insertRule(`.stone {
        position: absolute;
        top: 5%; left: 5%;
        width: 85%; height: 85%;
        transform-style: preserve-3d;
        transition: 0.2s;
        transform: rotateY(0deg);
    }`, 0);
    css.insertRule(`.white, .black {
        position: absolute;
        width: 100%; height: 100%;
        backface-visibility: hidden;
        border-radius: 50%;
        box-shadow: 0.2rem 0.2rem rgba(0,0,0,0.6);
    }`, 0);
    css.insertRule(`.white {
        background-color: white;
        transform: rotateY(180deg);
    }`, 0);
    css.insertRule(`.black {
        background-color: black;
    }`, 0);
}
