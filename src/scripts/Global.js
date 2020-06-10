const Global = {
    CardThickness: .01,
    CardWidth: .5,
    CardHeight: 1, // Note: This is automatically set by the below aspect ratio
    CardAspectRatio: 0.6271551724137931,
    CardUVx: 0.629,
    DeckVisualHeight: 70,
    DeckGap: 0.01,
};

Global.CardHeight = Global.CardWidth / Global.CardAspectRatio;

export { Global };