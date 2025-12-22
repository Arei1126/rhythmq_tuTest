"use strict";
const PINK = "#ff0055";
let debugLog = null;

function drawCenteredText(ctx, text, x, y, color = '#000', font = '16px sans-serif') {
    // 1. 現在の描画状態（色や配置設定など）を保存する
    // これにより、この関数内での変更が外部に影響しないようにする
    ctx.save();

    // 2. 引数で受け取ったスタイルを適用
    ctx.fillStyle = color;
    ctx.font = font;

    // 3. テキストの配置基準を中心(Center/Middle)に設定
    // 横方向の中心合わせ
    ctx.textAlign = 'center';
    // 縦方向の中心合わせ
    ctx.textBaseline = 'middle';

    // 4. 文字を描画する
    // 設定により、(x, y) が文字の重心になる
    ctx.fillText(text, x, y);

    // 5. 描画状態を保存した時点(1)に戻す
    // textAlignなどをデフォルトに戻す手間が省ける
    ctx.restore();
}

function drawCenteredRect(ctx, x, y, width, height, isFill = true) {
    // 1. 中心座標から左上の描画開始位置を計算する
    // 幅と高さの半分を引くことで、中心を合わせる
    const drawX = x - (width / 2);
    const drawY = y - (height / 2);

    // 2. 描画パスを開始する (設定変更の影響を防ぐため)
    ctx.beginPath();

    // 3. モードに応じて描画を実行する
    if (isFill) {
        // 塗りつぶし描画
        ctx.fillRect(drawX, drawY, width, height);
    } else {
        // 線画描画
        ctx.strokeRect(drawX, drawY, width, height);
    }
}

function drawCenteredRoundRect(ctx, x, y, width, height, strokeColor = "white", fillColor = PINK, blurColor = "white", isFill = true) {
	ctx.save();
    // 1. 中心座標から左上の描画開始位置を計算する
    // 幅と高さの半分を引くことで、中心を合わせる
    const drawX = x - (width / 2);
    const drawY = y - (height / 2);

	ctx.shadowBlur = 20;
	ctx.shadowColor = blurColor;
	ctx.fillStyle = fillColor;
	ctx.strokeStyle = strokeColor;


    // 2. 描画パスを開始する (設定変更の影響を防ぐため)
    ctx.beginPath();

	ctx.roundRect(drawX,drawY,width,height,10);
    // 3. モードに応じて描画を実行する
    if (isFill) {
        // 塗りつぶし描画
	    ctx.fill();

    } 
        // 線画描画
	    ctx.stroke();
    
	ctx.restore();
}


class Conductor {
    constructor(audioCtx) {
        this.audioCtx = audioCtx;
        this.startTime = 0;
        this.offset = 0; // ユーザー設定のズレ調整
        this.isPlaying = false;
    }

    play() {
        this.startTime = this.audioCtx.currentTime;
        this.isPlaying = true;
        // ...source.start() とか
    }

    // ★これが「ゲーム内時間」の正体！
    getCurrentTime() {
        if (!this.isPlaying) return 0;
        
        // 生の時間 - 開始時間 - オフセット
        return this.audioCtx.currentTime - this.startTime - this.offset;
    }
}

class JudgeSystem {
    // コンストラクタで「ノートの管理者」を教えてもらう
    constructor(canvas, audioctx, config,noteManager) {
        this.noteManager = noteManager; 
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;
	    	this.good = config.threshods[0];
	    	this.bad = config.threshods[1];
	    	this.conductor = this.config.conductor;
    }

    // プレイヤーがボタンを押した瞬間に呼ばれる
    // inputTime: 押した時間, laneIndex: レーン番号
    handleInput(laneIndex) {
        const inputTime = this.conductor.getCurrentTime();
        // 1. 対象のノーツを見つける（Find）
        // activeNotesの中から、「そのレーン」にいて、「まだ生きてる（判定されてない）」
        // 一番古い（配列の最初の方にある）やつを探す
        const targetNote = this.noteManager.activeNotes.find(note => 
            note.noteData.lane === laneIndex && !note.isHit
        );

        // もし対象がいなければ（空打ち）、ここで終了
        if (!targetNote) {
		console.log("空打ち");
		return;
		}

        // 2. 判定ロジック（Calculate）
        // 入力時間と、ノーツの理想時間のズレを計算
        const diff = Math.abs(inputTime - targetNote.noteData.time);

        // 判定基準（定数とかで定義しておくと吉）
        let judgeResult = null;
	if(diff < this.good){
			judgeResult = GOOD;
	}else if(diff < this.bad){
			judgeResult = BAD;
	}

        // 3. 入力処理（Apply） 
	    // アンケート結果もここ
	    // 空打ちじゃなければ、アンケート結果に入れていい。
	
        if (judgeResult) {
            // 判定成立！ノーツに結果を伝える
            targetNote.onHit(judgeResult);
            
            // ついでにスコア加算とかもここで呼ぶ
            // scoreManager.addScore(judgeResult);
            
            console.log(`判定: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒) GOOD:1 BAD:0 MISS:-1`);
		debugLog.innerText = `判定: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒) GOOD:1 BAD:0 MISS:-1`;

        }else{
		console.log(`ミス!: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒)`); 
		debugLog.innerText = `ミス!: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒)`;
	}
    }
}

class NoteObject  {
	constructor(canvas, audioctx, config,index, noteData,noteResult){
		this.index = index;
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;
		this.noteData = noteData;
		this.noteResult = noteResult;
		this.isDead = false;

	    	this.conductor = this.config.conductor;
	};

	onHit(judgeResult){
		this.noteResult.judge = judgeResult;
		this.noteResult.answer = YES;
		this.isDead = true;
	};

	update(){
		// ここにアニメーションをついか noteの表示をする
		const now = this.conductor.getCurrentTime();
		const len = this.config.lengthToBar + this.config.noteHeight/2;
		const advanceTime = this.config.timeAdvance;
		const velocity =  len/advanceTime; //pixel per second

		const diff = now - (this.noteData.time - advanceTime);
		//const diff = this.noteData.time - 
		const y = -0.5*this.config.noteHeight + diff*velocity;  // barHeight分オッセットしてう

		const text = this.noteData.text;

		const ctx = this.canvas.getContext("2d");

		
		const fontSize = this.config.noteWidth / (text.length*1.5);
		ctx.font = `${fontSize}px sans-serif`;

		// 3. 塗りつぶしの色を設定
		ctx.fillStyle = '#ff0055'; // 鮮やかなピンク
		
		const x = this.canvas.width/(this.config.numberOfLanes+1) * (this.noteData.lane + 1)
		//drawCenteredRect(ctx,x , y, this.config.noteWidth, this.config.noteHeight);
		drawCenteredRoundRect(ctx,x , y, this.config.noteWidth, this.config.noteHeight,"white", PINK,PINK,true);

		drawCenteredText(ctx,text,x,y,"white", ctx.font);
		// 4. 文字を描画する
		// ctx.fillText(文字列, X座標, Y座標, [最大幅(省略可)]);
		//ctx.fillText(text,,y);


		
	};
}

class LaneEffect {
	constructor(canvas,audioctx, config){
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;

		this.active = false;
		this.timer = 200;  //ms
		this.mode = false;

	    	this.conductor = this.config.conductor;
	};

	update(){};



}

class Lane {
	constructor(canvas,audioctx, config){
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;
		this.effect = new LaneEffect(canvas,audioctx,config);

	    	this.conductor = this.config.conductor;
	}

	update(){
		
	}


}

class HbarEffect {
	constructor(canvas,audioctx, config){
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;

	    	this.conductor = this.config.conductor;
	}
}


class Hbar {
	constructor(canvas,audioctx, config){
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;
		this.effect = new HbarEffect(canvas,audioctx,config);

	    	this.conductor = this.config.conductor;
	}
	update(){
		const ctx = this.canvas.getContext("2d");
		ctx.save();
		ctx.fillStyle = "yellow";

		ctx.shadowBlur = 20;
		ctx.shadowColor = "yellow";
		drawCenteredRect(ctx, 1/2*this.canvas.width, this.config.lengthToBar, this.canvas.width,this.config.barHeight,true);
		ctx.restore();
	}
}

class NoteManager {
	constructor(canvas,audioctx,config){
		this.canvas = canvas;
		this.config = config;
		this.audioctx = audioctx;

		this.scoreData = config.scoreData;
		this.noteResults = config.noteResults;
		
		this.nextSpawnIndex = 0;
		this.activeNotes = [];

	    	this.conductor = this.config.conductor;
	}

	update(){
		const timeAdvance = this.config.timeAdvance;
		const now = this.conductor.getCurrentTime();

		while (this.nextSpawnIndex < this.scoreData.length) {

			// 1. しおりの場所にあるノーツデータを見る
			const targetNoteData = this.scoreData[this.nextSpawnIndex];

			// 2. 出現させるべき時間を計算
			const spawnTime = targetNoteData.time - timeAdvance;

			// 3. まだ未来の話なら、ここで即終了
			// データが時間順に並んでるから、これ以降を見る必要ナシ！
			if (spawnTime > now) {
				break; 
			}

			// 4. ★ここに来た時点で「スポーン確定」！
			// オブジェクトを作って activeNotes に入れる
			const newNote = new NoteObject(this.canvas, this.audioctx,this.config,this.nextSpawnIndex, this.scoreData[this.nextSpawnIndex],this.noteResults[this.nextSpawnIndex]);
			this.activeNotes.push(newNote);
			console.log(`notePushed: ${now}`);

			// 5. 【超重要】しおりを1つ進める
			// これにより、今の targetNoteData は二度と参照されなくなる！
			// = 二重スポーン絶対阻止！！
			this.nextSpawnIndex++;
		}

		// --- 移動と削除の処理 ---
		// こっちは activeNotes だけを見ればいい
		if(this.activeNotes){
			this.activeNotes = this.activeNotes.filter(note => {
				note.update();
				if(now > note.noteData.time + this.config.threshods[2]*5){
					note.isDead = true;
					console.log(`Killed: ${now}`);
				}


			return !note.isDead; // 死んだやつはリストから消える
		});

		}

	}
}






/*
 * @class
 * @property {AudioContext} aidioCtx 
 * @property {HTMLCanvasElement} scoreCanvas
 * @property {} scoreData
 */

const WIDTH = 800;
const HEIGHT = 1600;

/*
const WIDTH = 1080;
const HEIGHT = 3240;
*/
const SLIDER_HEIGHT = 3240/5
const Config = {
		"timeAdvance": 2.5,
		"threshods": [0.05,0.15,0.45], // good, bad, input, +-である[0.05,0.1,0.15]
	}

const NA = -1;
const YES = 1;
const NO = 0

const GOOD = 1
const BAD = 0
const MISS = -1;


export class ScoreDrawer {
	constructor(signal, audioCtx, scoreCanvas, scoreData, config = Config){
		this.signal = signal;
		this.audioCtx = audioCtx;
		this.canvas = scoreCanvas;
		this.scoreData = scoreData;
		this.config = config;

		this.timeAdvance = config.timeAdvance;
	
		this.canvas.width = WIDTH;
		this.canvas.height = HEIGHT;
		
		this.canvasCtx = this.canvas.getContext("2d");


		this.numberOfLanes =  this.scoreData.info.numberOfLanes;

		this.laneWidth = this.canvas.width / this.scoreData.info.numberOfLanes;
		

		this.numberOfNotes = scoreData.notes.length;
		
		this.config.scoreData = this.scoreData.notes;
		this.config.laneWidth = this.laneWidth;
		this.config.noteWidth = this.laneWidth*0.8;
		this.config.barHeight = this.canvas.height*0.025; // これでいいのか？
		this.config.lengthToBar = this.canvas.height*0.95; // これでいいのか？上から判定ラインまでの長さ
		this.config.noteHeight = this.canvas.height*0.1;
		this.config.numberOfLanes = this.numberOfLanes;

		this.config.numberOfLanes =  this.scoreData.info.numberOfLanes;

		this.noteResults = Array.from({length: this.numberOfNotes}, (_, i) => ({
			"index": i,
			"noteData": this.scoreData.notes[i],
			"answer": NA,
			"judge": NA,
		}));

		this.config.noteResults = this.noteResults;


		// ここから、update内で使うグローバル変数


		this.lanes = Array.from({length: this.numberOfLanes},(_,i) =>
				({
					"index": i,
					"lane": new Lane(this.canvas,this.audioCtx,this.config)
				})
		);

		this.conductor = new Conductor(this.audioCtx);
		this.config.conductor = this.conductor;

		this.noteManager = new NoteManager(this.canvas, this.audioCtx, this.config);

		this.judgeSystem = new JudgeSystem(this.canvas, this.audioCtx,this.config,this.noteManager);

		this.conductor.play();
		
		// ここから、ノーツ以外のUI
		this.hbar = new Hbar(this.canvas,this.audioCtx,this.config);

		this.log = document.querySelector("#debugLog");
		debugLog = this.log;


	}

	update(){
		const ctx = this.canvasCtx;

		ctx.fillStyle = "black";
		ctx.fillRect(0,0,this.canvas.width, this.canvas.height);

		this.noteManager.update();
		this.hbar.update();
		
	}  // end update()

	input(index){
		this.judgeSystem.handleInput(index);
	}



}
