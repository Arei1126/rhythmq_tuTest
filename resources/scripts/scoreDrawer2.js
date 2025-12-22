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
            note.lane === laneIndex && !note.isHit
        );

        // もし対象がいなければ（空打ち）、ここで終了
        if (!targetNote) {
		console.log("空打ち");
		return;
		}

        // 2. 判定ロジック（Calculate）
        // 入力時間と、ノーツの理想時間のズレを計算
        const diff = Math.abs(inputTime - targetNote.targetTime);

        // 判定基準（定数とかで定義しておくと吉）
        let judgeResult = null;
	if(diff < this.good){
			judgeResult = GOOD;
	}else if(diff < this.bad){
			judgeResult = BAD;
	}

        // 3. 入力処理（Apply） 
	    // アンケート結果もここ
        if (judgeResult) {
            // 判定成立！ノーツに結果を伝える
            targetNote.onHit(judgeResult);
            
            // ついでにスコア加算とかもここで呼ぶ
            // scoreManager.addScore(judgeResult);
            
            console.log(`判定: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒)`);
        }else{
		console.log(`ミス!: ${judgeResult} (ズレ: ${diff.toFixed(3)}秒)`); 
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
		this.noteReuslt = noteResult;
		this.isDead = false;

	    	this.conductor = this.config.conductor;
	};

	onHit(judgeResult){
		this.noteResult.judge = judgeResult;
		this.noteReuslt.answer = YES;
		this.isDead = true;
	};

	update(){
		// ここにアニメーションをついか noteの表示をする
		
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
			const newNote = new NoteObject(this.canvas, this.config,this.audioctx,this.nextSpawnIndex, this.scoreData[this.nextSpawnIndex],this.noteResults[this.nextSpawnIndex]);
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
				if (note.noteData.time > this.conductor.getCurrentTime() + this.config.threshods[2]){
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

const WIDTH = 320;
const HEIGHT = 540;
const JUDGE_HEIGHT = 500;

/*
const WIDTH = 1080;
const HEIGHT = 3240;
*/
const SLIDER_HEIGHT = 3240/5
const Config = {
		"timeAdvance": 2.5,
		"threshods": [0.05,0.1,0.15], // good, bad, input, +-である
	}

const NA = -1;
const YES = 1;
const NO = 0

const GOOD = 1
const BAD = 0



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
		this.config.barHeight = this.canvas.height*0.05; // これでいいのか？
		this.config.lengthToBar = this.canvas.height*0.8; // これでいいのか？上から判定ラインまでの長さ
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


	}

	update(){
		const currentTime = this.conductor.getCurrentTime();
		
		const ctx = this.canvasCtx;
		const width = this.canvas.width;
		const height = this.canvas.height;

		const notes = this.scoreData.notes;
		const noteState = this.noteState;

		ctx.fillstyle = "black";
		ctx.fillRect(0,0,this.canvas.width, this.canvas.height);

		this.noteManager.update();
		
	}  // end update()

	input(index){
		this.judgeSystem.handleInput(index);
	}



}
