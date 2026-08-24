import { ChannelPoll, ChannelPrediction } from "../types";
import { TypedEmitter } from "tiny-typed-emitter";

type Events = {
    'channel-poll-begin': (poll: ChannelPoll) => void;
    'channel-poll-progress': (poll: ChannelPoll) => void;
    'channel-poll-end': (poll: ChannelPoll) => void;
    'channel-prediction-begin': (prediction: ChannelPrediction) => void;
    'channel-prediction-progress': (prediction: ChannelPrediction) => void;
    'channel-prediction-lock': (prediction: ChannelPrediction) => void;
    'channel-prediction-end': (prediction: ChannelPrediction) => void;
};

class InternalBus extends TypedEmitter<Events> {
    constructor() {
        super();
    }
}

const bus = new InternalBus();

export { bus as InternalBus };