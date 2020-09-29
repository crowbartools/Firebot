import React from "react";
import ReactDOM from "react-dom";

/**
 * @example
 * {store.showWindow && (
 *      <SubWindow
 *          windowName="Some Name"
 *          onClose={() => (store.showWindow = false)}
 *      >
 *          <div>Some content</div>
 *      </SubWindow>
 * )}
 */
export class SubWindow extends React.Component<{
    windowName: string;
    onClose: VoidFunction;
}> {
    private containerEl = document.createElement("div");

    private externalWindow: Window | null = null;

    componentDidMount() {
        this.externalWindow = window.open(
            "",
            `Firebot - ${this.props.windowName}`
        );

        if (this.externalWindow) {
            this.externalWindow.document.body.appendChild(this.containerEl);
            this.externalWindow.onunload = () => this.props?.onClose();
        }
    }

    componentWillUnmount() {
        if (this.externalWindow) {
            this.externalWindow.close();
        }
    }

    render() {
        return ReactDOM.createPortal(this.props.children, this.containerEl);
    }
}
