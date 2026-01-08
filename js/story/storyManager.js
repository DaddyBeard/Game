export class StoryManager {
    constructor(game) {
        this.game = game;
    }

    startIntro() {
        console.log("📜 Story: Starting Intro Sequence");
        // Here we would call UI to show dialogue
        // this.game.ui.showDialogue("Mentor", "Welcome to the airline business!");
    }
}
