"use strict";

// Moops, not moors, Moops.
class MoopBoard {

    // privates
    constructor  (gameboard) {
        this.size = gameboard.length;
        this.gameboard = Object.freeze(gameboard.map(line => Object.freeze(line)));
        this.blanks = Object.freeze(this.pointsOf(MoopBoard.BLANK));
        this.blacks = Object.freeze(this.pointsOf(MoopBoard.BLACK));
        this.whites = Object.freeze(this.pointsOf(MoopBoard.WHITE));
        Object.seal(this);
    }



    static newGame(size = 8) {
        console.assert(size >= 4 && size % 2 === 0);
        const r = size >> 1, l = r - 1;
        const gameboard = Array.from(
            Array(size), _ => Array(size).fill(MoopBoard.BLANK));
        gameboard[l][l] = gameboard[r][r] = MoopBoard.WHITE;
        gameboard[l][r] = gameboard[r][l] = MoopBoard.BLACK;
        consle.log(gameboard);
        return new MoopBoard(gameboard);
    }
    nextTurn(side, x, y) {
        console.log(this.validPlace(side, x, y));
        const reverses = this.reverses(side, x, y);
        console.log(reverses.length > 0);
        const newBoard = this.gameboard.map(line => line.concat());
        reverses.forEach(p => newBoard[p.y][p.x] = side);
        newBoard[y][x] = side;
        return new MoopBoard(newBoard);
    }

    // state of board
    isPass(side) {
        return this.blanks.every(
            p => this.reverses(side, p.x, p.y).length === 0);
    }
    isEnd() {
        return this.blanks.length === 0 ||
            this.isPass(MoopBoard.BLACK) && this.isPass(MoopBoard.WHITE);
    }
    reverseCount(side, x, y) {
        return this.validPlace(side, x, y) ?
            this.reverses(side, x, y).length : 0;
    }

    points() {
        return [].concat(...Array.from(Array(this.size), (_, y) => Array.from(
            Array(this.size), (_, x) => Object.freeze({x, y}))));
    }
    pointsOf(state) {
        return this.points().filter(p => this.gameboard[p.y][p.x] === state);
    }

    validPoint(x, y) {
        return 0 <= x && x < this.size && 0 <= y && y < this.size;
    }
    validPlace(side, x, y) {
        return (side === MoopBoard.BLACK || side === MoopBoard.WHITE) &&
            this.validPoint(x, y) && this.gameboard[y][x] === MoopBoard.BLANK;
    }

    reverses(side, x, y) {
        return [].concat(
            this.lineReverses(side, x, y, p => ({x: p.x, y: p.y - 1})),
            this.lineReverses(side, x, y, p => ({x: p.x, y: p.y + 1})),
            this.lineReverses(side, x, y, p => ({x: p.x - 1, y: p.y})),
            this.lineReverses(side, x, y, p => ({x: p.x + 1, y: p.y})),
            this.lineReverses(side, x, y, p => ({x: p.x - 1, y: p.y - 1})),
            this.lineReverses(side, x, y, p => ({x: p.x + 1, y: p.y - 1})),
            this.lineReverses(side, x, y, p => ({x: p.x - 1, y: p.y + 1})),
            this.lineReverses(side, x, y, p => ({x: p.x + 1, y: p.y + 1})));
    }
    lineReverses(side, x, y, next) {
        const ps = [];
        for (let p = next({x, y}); this.validPoint(p.x, p.y); p = next(p)) {
            const s = this.gameboard[p.y][p.x];
            if (s === -side) ps.push(Object.freeze(p));
            else if (s === side) return ps;
            else return [];
        }
        return [];
    }
}
MoopBoard.BLANK = 0;
MoopBoard.BLACK = 1;
MoopBoard.WHITE = -1;
