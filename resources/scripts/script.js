`use strict`
import {ScoreDrawer} from "./scoreDrawer2.js"
import {InputManager} from "./inputManagerKey.js"
import {SoundEffectManager} from "./effectSoundManager.js"

const NA = -1;
const YES = 1;
const NO = 0

const scoreData = 
{
	"info": {
		"numberOfLanes": 2,
		"title": "テストあんけーと"
		},
	"notes": [
			{"time": 5, "text": "私は天麻派", "lane": 0},
			{"time": 10, "text": "私は天派", "lane": 1},
			{"time": 15, "text": "私は麻派", "lane": 0},
			{"time": 20, "text": "私は派", "lane": 1},
			{"time": 25, "text": "私は天", "lane": 0},
			{"time": 30, "text": "私は麻", "lane": 0},
			{"time": 35, "text": "8もんめ", "lane": 0},
			{"time": 40, "text": "9", "lane": 1},
			{"time": 45, "text": "長いとどうなるのかな、見切れたりするのかな", "lane": 0},
			{"time": 50, "text": "11", "lane": 0},
			{"time": 55, "text": "12", "lane": 0},
			{"time": 60, "text": "13", "lane": 0},
			{"time": 65, "text": "最後の質問", "lane": 0},
		]	
}

window.addEventListener("load", async ()=>{
	const scoreCanvas = document.querySelector("#scoreCanvas");
	const Signal = document.createElement("div");


	function main(){
		document.removeEventListener("pointerdown", main);
		const audioCtx = new AudioContext();
		const config = {"timeAdvence": 500}
		const scoreDrawer = new ScoreDrawer(Signal,audioCtx, scoreCanvas, scoreData);
		const inputManagaer = new InputManager(Signal);

		const soundEffectManager = new SoundEffectManager(Signal);
		
		Signal.addEventListener("input", (e)=>{
			const i = e.detail.index;
			scoreDrawer.input(i);
		});

		function update(){
			scoreDrawer.update();
			window.requestAnimationFrame(update);
		}
		
		window.requestAnimationFrame(update);


	}


	document.addEventListener("pointerdown", main);


});
