/*
 * @class
 * @property {AudioContext} aidioCtx 
 * @property {HTMLCanvasElement} scoreCanvas
 * @property {} scoreData
 */

const WIDTH = 320;
const HEIGHT = 540;

/*
const WIDTH = 1080;
const HEIGHT = 3240;
*/
const SLIDER_HEIGHT = 3240/5
const Config = {
	"timeAdvance": 500,
	"threshods": [50,100,150] // good, bad, input, +-である
}

const NA = -1;
const YES = 1;
const NO = 0

const GOOD = 1
const BAD = 0



export class ScoreDrawer {
	constructor(audioCtx, scoreCanvas, scoreData, config = Config){
		this.audioCtx = audioCtx;
		this.scoreCanvas = scoreCanvas;
		this.scoreData = scoreData;
		this.config = config;

		this.timeAdvance = config.timeAdvance;
	
		this.scoreCanvas.width = WIDTH;
		this.scoreCanvas.height = HEIGHT;
		
		this.canvasCtx = this.scoreCanvas.getContext("2d");


		this.numberOfLanes =  this.scoreData.info.numberOfLanes;

		this.laneWidth = this.scoreCanvas.width / this.scoreData.info.numberOfLanes;
		
		this.sliderWidth = this.laneWidth*0.8;

		this.numberOfNotes = scoreData.notes.length;

		this.noteState = Array.from({length: this.numberOfNotes}, (_, i) => ({
			"index": i,
			"note": this.scoreData.notes[i],
			"processing": false,
			"completed": false,
			"answer": NA,
			"judge": NA,
		}));

		// ここから、update内で使うグローバル変数
		//
		this.oldestNotesInDraw = Array.form({length: this.numberOfLanes},(_,i) =>(null));
		//this.oldestIndexesInDraw = Array.form({length: this.numberOfLanes},(_,i) =>(0));

	}

	update(){
		const currentTime = this.audioCtx.currentTime;
		
		const ctx = this.canvasCtx;
		const width = this.scoreCanvas.width;
		const height = this.scoreCanvas.height;

		const notes = this.scoreData.notes;
		const noteState = this.noteState;

		ctx.fillstyle = "black";
		ctx.fillRect(0,0,this.scoreCanvas.width, this.scoreCanvas.height);

		const indexesCandid = Array.form({length: this.numberOfLanes},(_,i) =>(0));
		const oldestNotesCandid = Array.form({length: this.numberOfLanes},(_,i) =>(0));


		for ( const i = notes.length - 1; i > 0; i--){
			const note = notes[i];
			if( (note.time - this.config.timeAdvance < currentTime ) && ( currentTime < note.time + this.config.threshods[2])){
				noteState.processing = true;
				//indexesCandid[note.lane] = i;
				oldestNotesCandid[note.lane] = noteState[i];

			}
			else{
				noteState.processing = false;
			}
		}

		//this.oldestIndexesInDraw = indexesCandid;  // 描画中でかつもっとも古いノート=入力の対象
		this.oldestNotesInDraw = oldestNotesCandid;  // 描画中でかつもっとも古いノート=入力の対象
		
		for (const note of noteState){
			if(note.processing && !(note.completed)){
			// 指定位置に描画
			}
		}



	
	
	}  // end update()

	input(laneIndex){
		// ここで描画処理をしよう
		// おされたら、どう反応？
		// ノートはどういう反応？
		const now = this.audioCtx.currentTime;
		const note = this.oldestNotesInDraw[laneIndex];
		const thr = this.config.threshods;
		if( note.note.time -  thr[0] < now && now < note.note.time + thr[0]){
			// good
			note.completed = true;
			note.processing = false;
			note.answer = YES;
			note.judge = GOOD;
		}
		else if( note.note.time -  thr[1] < now && now < note.note.time + thr[2]){
			//bad
			note.completed = true;
			note.processing = false;
			note.answer = YES;
			note.judge = BAD;
		}else{
			// あまりにずれてたら無視
		}
		
		
	}  // end input

}
