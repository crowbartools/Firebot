'use strict';

(function() {

    angular
        .module('firebotApp')
        .component("eosReplaceVariables", {
            template: `
            <eos-collapsable-panel show-label="Show Text Variables" hide-label="Hide Text Variables">
                <div>
                    <eos-replace-variable-section name="General">
                        <ul>
                            <li><b>$(user)</b> - Replaced by the name of the person running the button, command, or event</li>
                            <li><b>$(time)</b> - The current time. Use $(time24) for 24 hour time.</li>
                            <li><b>$(date)</b> - The current date, formatted ie "Jun 1st 2018"</li>
                            <li><b>$(uptime)</b> - How long the stream has been broadcasting</li>
                            <li><b>$(streamer)</b> - The name of the account signed in as the Streamer</li>
                            <li><b>$(bot)</b> - The name of the account signed in as the Bot</li>
                            <li><b>$(game)</b> - The game you are currenly or last played</li>
                            <li><b>$(game[streamerName])</b> - The game the provided streamer last played. Can be used in conjuction with $(arg) or $(target), ie $(game[$(target)])</li>
                            <li><b>$(streamTitle)</b> - The current title of your stream.</li>
                            <li><b>$(userAvatarUrl)</b> - The url of the users avatar. Useful in Show Image effects!</li>
                            <li><b>$(randomViewer)</b> - The name of a random viewer in chat.</li>
                            <li><b>$(randomNumber[low-high])</b> - Get a random number between the low and high numbers, ie $(randomNumber[1-10])</li>
                            <li><b>$(math[expression])</b> - Evaluate the given expression. Can combine with other vars like randomNumber, ie $(math[2 + $(randomNumber[1-5])]) Learn more <a class="clickable" style="color:#53afff;" ng-click="$ctrl.openLinkExternally('http://mathjs.org/docs/expressions/syntax.html')">here</a>.</li>
                            <li><b>$(readApi[url])</b> - Calls the given url and inserts the response. If the response is JSON, you can traverse the object. Learn more <a class="clickable" style="color:#53afff;" ng-click="$ctrl.openLinkExternally('https://github.com/Firebottle/Firebot/wiki/Advanced-Uses#advanced-replace-variables')">here</a>.</li>
                            <li><b>$(readFile[filepath])</b> - Gets the contents of the given txt file, ie $(readFile[C:/some/path/file.txt])</li>
                            <li><b>$(readRandomLine[filepath])</b> - A random line from the given txt file</li>
                        </ul>
                    </eos-replace-variable-section>

                    <eos-replace-variable-section name="Interactive & Commands">
                        <ul>
                            <li><b>$(text)</b> - Replaced by the interactive button text or the chat command ID.</li>
                            <li><b>$(cost)</b> - Replaced by the cost of the command or button.</li>
                            <li><b>$(cooldown)</b> - Replaced by the cooldown of the command or button.</li>
                        </ul>
                    </eos-replace-variable-section>

                    <eos-replace-variable-section name="Interactive Only">
                        <ul>
                            <li><b>$(textboxValue)</b> - Only works if this effect is attached to a Textbox. This will contain the value of the Textbox.</li>
                            <li><b>$(tooltip)</b> - The tooltip of the button that was pressed.</li>
                            <li><b>$(progress)</b> - The current percentage of the progress bar on a button.</li>
                            <li><b>$(activeState)</b> - The active state of a button, displays 'enabled' or 'disabled'.</li>
                            <li><b>$(activeStateReverse)</b> - The reverse active state of a button, displays 'disabled' or 'enabled'.</li>
                        </ul>
                    </eos-replace-variable-section>

                    <eos-replace-variable-section name="Commands Only">
                        <ul>
                            <li><b>$(arg#)</b> - Replaced by the argument provided after a chat command. For example, $(arg) or $(arg1) pulls the first word after the command, whereas $(arg5) would pull the fifth word.</li>
                            <li><b>$(arg#-#)</b> - Grab a range of arguments. Combines them with spaces. IE if command was "<i>!command these are some words</i>":
                                <ul>
                                    <li><b>$(arg2-3)</b> = "are some" </li>
                                    <li><b>$(arg2-last)</b> = "are some words"</li>
                                    <li><b>$(argAll)</b> = "these are some words"</li>
                                </ul>
                            </li>
                            <li><b>$(target)</b> - Acts like the $(arg) variable but strips out any leading "@", useful when the argument is expected to be a username. Like $(arg), it also supports the $(target#) format for selecting different words.</li>
                        </ul>
                    </eos-replace-variable-section>
                    
                    <eos-replace-variable-section name="Events Only">
                        <ul>
                            <li><b>$(subMonths)</b> - This is replaced by the total months a person has been subbed. Meant to be used on subscriber events.</li>
                        </ul>
                    </eos-replace-variable-section>               
                </div>
            </eos-collapsable-panel>
            `,
            controller: function($rootScope) {
                let ctrl = this;
                ctrl.openLinkExternally = $rootScope.openLinkExternally;
            }
        });
}());