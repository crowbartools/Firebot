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
    width?: number;
    height?: number;
    onClose: VoidFunction;
}> {
    private containerEl = document.createElement("div");

    private externalWindow: Window | null = null;

    componentDidMount() {
        const { windowName, width, height } = this.props;
        const windowOptions: Electron.BrowserWindowConstructorOptions = {
            title: `Firebot - ${windowName}`,
            width: width ?? 300,
            height: height ?? 300
        }
        this.externalWindow = window.open(
            "",
            windowOptions.title,
            Object.entries(windowOptions)
                .map(([key, value]) => `${key}=${value}`)
                .join(",")
        );

        if (this.externalWindow) {
            this.copyStyles(document, this.externalWindow.document);
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

    private copyStyles(sourceDoc: Document, targetDoc: Document) {
        Array.from(sourceDoc.styleSheets).forEach(styleSheet => {
            let handledHref = false;
            if (styleSheet.href) { // for <link> elements loading CSS from a URL
                handledHref = true;
                const newLinkEl = sourceDoc.createElement('link');
          
                newLinkEl.rel = 'stylesheet';
                newLinkEl.href = styleSheet.href;
                targetDoc.head.appendChild(newLinkEl);
            }
            try {
                if (!handledHref && styleSheet.cssRules) { // for <style> elements
                    const newStyleEl = sourceDoc.createElement('style');
              
                    Array.from(styleSheet.cssRules).forEach(cssRule => {
                      // write the text of each rule into the body of the style element
                      newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                    });
              
                    targetDoc.head.appendChild(newStyleEl);
                  } 
            } catch(error) {
                // fail silently
            }
        });
    }    
}
