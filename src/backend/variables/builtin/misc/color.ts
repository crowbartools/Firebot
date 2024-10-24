import { ReplaceVariable } from "../../../../types/variables";
import tinycolor from "tinycolor2";

const model: ReplaceVariable = {
    definition: {
        handle: "color",
        examples: [
            {
                usage: 'color[red]',
                description: "returns '#ff0000'"
            },
            {
                usage: 'color[red, hex]',
                description: "returns '#ff0000'"
            },
            {
                usage: 'color[red, hexa, 255]',
                description: "returns '#ff0000ff'"
            },
            {
                usage: 'color[green, ahex, 255]',
                description: "returns '#ff00ff00'"
            },
            {
                usage: 'color[red, rgb]',
                description: "returns 'rgb(255, 0, 0)'"
            },
            {
                usage: 'color[red, rgbp]',
                description: "returns 'rgb(100%, 0, 0)'"
            },

            {
                usage: 'color[#00ff00, hsl]',
                description: "returns 'hsl(0, 100%, 50%)'"
            },
            {
                usage: 'color[#ff00ff00, hsv, 0.5]',
                description: "returns 'hsv(0, 100%, 100%)'"
            },
            {
                usage: 'color[#ff00ff00, dec]',
                description: "returns decimal value"
            }
        ],
        description: "outputs color in specified format",
        possibleDataOutput: ["text"]
    },
    evaluator: async (
        _,
        colorString: string,
        type: string,
        alpha: null | number | string = 1
    ) => {
        const color = tinycolor(colorString);
        alpha = Number(alpha) > 1 ? Number(alpha) / 255 : Number(alpha);
        color.setAlpha(Number(alpha));
        let hexColor = color.toHex8String();
        let output;
        switch (type) {
            case "hex":
                output = color.toHexString();
                break;
            case "hexa":
                output = hexColor;
                break;
            case "ahex":
                hexColor = hexColor.replace("#", "");
                output = `#${hexColor.substring(6, 8)}${hexColor.substring(0, 2)}${hexColor.substring(2, 4)}${hexColor.substring(4, 6)}`;
                break;
            case "rgb":
                output = color.toRgbString();
                break;
            case "rgbp":
                output = color.toPercentageRgbString();
                break;
            case "hsl":
                output = color.toHslString();
                break;
            case "hsv":
                output = color.toHsvString();
                break;
            case "dec":
                hexColor = hexColor.replace("#", "");
                output = parseInt(hexColor, 16);
                break;
            default:
                output = color.toHexString();
                break;
        }
        return output;
    }
};

export default model;