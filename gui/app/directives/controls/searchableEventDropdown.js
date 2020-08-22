"use strict";
(function() {
    //This a wrapped dropdown element that automatically handles the particulars

    angular.module("firebotApp").component("searchableEventDropdown", {
        bindings: {
            selected: "<",
            update: "&"
        },
        template: `
      <ui-select ng-model="$ctrl.selectedEvent" on-select="$ctrl.selectOption($item, $model)" theme="bootstrap">
        <ui-select-match placeholder="Select or search for an event... ">{{$select.selected.name}}</ui-select-match>
        <ui-select-choices repeat="option in $ctrl.options | filter: { name: $select.search }" style="position:relative;">
          <div ng-bind-html="option.name | highlight: $select.search"></div>
          <small class="muted"><strong>{{$ctrl.getSourceName(option.sourceId)}}</strong> | {{option.description}}</small>
        </ui-select-choices>
      </ui-select>
      `,
        controller: function(
            $scope,
            $element,
            $attrs,
            settingsService,
            listenerService
        ) {
            let ctrl = this;

            let events = listenerService.fireEventSync("getAllEvents", false);
            let sources = listenerService.fireEventSync("getAllEventSources", false);

            function getSelected() {
                // sort events by name
                ctrl.options = events.sort((a, b) => {
                    let textA = a.name.toUpperCase();
                    let textB = b.name.toUpperCase();
                    return textA < textB ? -1 : textA > textB ? 1 : 0;
                });

                //find the selected event in the list
                ctrl.selectedEvent = ctrl.options.find(
                    e =>
                        e.id === ctrl.selected.eventId &&
                        e.sourceId === ctrl.selected.sourceId
                );
            }

            // when the element is initialized
            ctrl.$onInit = function() {
                getSelected();
            };

            ctrl.$onChanges = function() {
                getSelected();
            };

            ctrl.getSourceName = function(sourceId) {
                let source = sources.find(s => s.id === sourceId);

                if (source) {
                    return source.name;
                }
                return null;
            };

            //when a new effect is selected, set the selected type
            ctrl.selectOption = function(option) {
                ctrl.update({
                    event: { eventId: option.id, sourceId: option.sourceId, name: option.name }
                });
            };
        }
    });
}());
