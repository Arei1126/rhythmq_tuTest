`use strict`
import {ScoreDrawer} from "./scoreDrawer2.js"
import {InputManager} from "./inputManagerKey.js"

const NA = -1;
const YES = 1;
const NO = 0

const scoreData = 
{
	"info": {
		"numberOfLanes": 1,
		"title": "テストあんけーと"
		},
	"notes": [
			{"time": 5, "text": "私は天麻派", "lane": 0},
			{"time": 10, "text": "私は天派", "lane": 0},
			{"time": 15, "text": "私は麻派", "lane": 0},
			{"time": 20, "text": "私は派", "lane": 0},
			{"time": 25, "text": "私は天", "lane": 0},
			{"time": 25, "text": "私は麻", "lane": 0},
			{"time": 30, "text": "私は麻", "lane": 0},
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

		
		Signal.addEventListener("input", (e)=>{
			const i = e.detail.index;
			scoreDrawer.input(i);
		})

		function update(){
			scoreDrawer.update();
			window.requestAnimationFrame(update);
		}
		
		window.requestAnimationFrame(update);


	}


	document.addEventListener("pointerdown", main);


});
