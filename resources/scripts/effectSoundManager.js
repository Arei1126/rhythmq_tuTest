export class SoundEffectManager{
	constructor(Signal){
		this.Signal = Signal;

		const se_hit = document.createElement("audio");
		se_hit.src = "./resources/assets/middleTom2.ogg";
		se_hit.display = "none";
		document.body.appendChild(se_hit);
		
		Signal.addEventListener("input",()=>{
			se_hit.currentTime = 0;
			se_hit.play();
		});
		}
}
