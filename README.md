## v4.0-alpha: AngularJS Port
### Disclaimer
This branch contains our early work on a new version of Firebot that converts the front end of the app to using AngularJS instead of jQuery. The app is not fully functional, will contain many bugs, and some (maybe even alot) of the changes could be scrapped, so it is not recommended that you use a build of this branch for anything other than testing.

### What Has Changed / Good-To-Know's
* Since we have new dependencies, you will probably want to run `npm install` in the repo before running the app for the first time.
* Angular is now being used to handle the front end. The back end is largely unchanged, however.
* Underscore.js has been added. This is a javascript utility library mainly for manipulating collections and objects. Super handy.
* The new front end work all lives in the new "./gui/app" directory. The old front end has been left in place as a reference while the port happens.
* The new FontAwesome5 is in ./gui/fonts/fontawesome5

### Known Issues
* Interactive tab is not complete (it's getting there though)
  * Most Effect Control templates have not been implemented yet.
  * The cooldown groups and group settings for a board aren't fully functional yet
  * Sometimes buttons dont play manually when they should
* The listener that listens for errors and displays a modal isn't implemented yet
* The connect/disconnect interactive button doesn't work yet.
* You currently cant delete effects from buttons
* Updates tab has not been implemented yet.

### To Do
* Finish implementing Interactive tab
  * make sure we can delete effects from a button
* Hook up interactive connect/disconnect button
* Implement Updates tab
* Update styles in the app to make a unified UI theme
* Thoroughly test everything
* Probably more that I am forgetting

### For Devs: High Level Angular Basics (in the context of Firebot)
This is going to give a very brief overview of the main concepts of AngularJS. It's not meant to teach everything in depth, only to provide enough info to help everyone make the decision if they want to continue using AngularJS or if we rather move on to Angular2 (or 4, or whatever they are calling it) or something else entirely.

#### Overview
There are three main concepts to know for AngularJS: Directives, Controllers, & Services.
If you already know these, skip to the *How Firebot Is Setup In AngularJS?* section below.
If you prefer to just look at some code, take a look at the html temlate and controller js file for the Viewer Groups tab as a starting point.
Below will be brief descriptions of each, but here are quick and dirty definitions:
* **Directives** - Extend HTML elements with functionality and data binding. Directives define the application.
* **Controllers** - Controllers control the application. Controllers are used by directives and other things to control and manage data that is displayed.
* **Services** - A function, or object, that is available for your AngularJS application. Commonly used for getting and storing data.

#### Directives
Angular works by extending HTML elements with **Directives**. In javascript, an angular "app" is created and given a name. In html, we use the `ng-app` directive on an element to tell Angular what that app controls. Anything inside the element that has the `ng-app` directive is controlled by the app. There are many directives built into Angular. A few of the common ones are: *ng-controller* (Defines the controller to be used for the html element and its children elements), *ng-model* (Defines a javascript varible to be the model for this element. IE, if you put a model for an text input, whatever is typed in that input will be put into the model.), and ng-repeat (Allows you to repeat an html element for a list of items in object/array). Custom Directives can be created as well. We just use one for effect options right now.

#### Controllers

#### Services

#### How Firebot Is Setup In AngularJS?
* We have a main *index.html* file that: loads all the js files, has the html for the left sidebar and upper header bar, and has the placeholder div for tab content.
  * We dynamically change the tab content using angular's *route* service, which basically intercepts changes in the url and updates an html element with a template file accordingly.
  * So we have a separate template file for every tab to help keep things segmented.
  * We have a mainController for the main index view and then each tab also has their own controller.
* services have been created for pretty much everything that is needed, so you can inject any service you need into any controller
* we are now using the angular version of Bootstrap (called 'Bootstrap UI')
* we load effect options for the "Edit Effect Modal" with the "effectOptions" directive. It works by passing it the effect type and object and it will: take the effect type (ie 'Play Sound'), make it lower case and replace spaces with dashes (ie 'play-sound'), and then loos for an html file with that name in the ./templates/interactive/effect-options/ folder to use as the template. It then passes the effect object to the controller/scope of the template so it can access and change the effect's values.

# Firebot
An app that allows streamers on Mixer.com to quickly and easily setup versitile interactive boards.

## What is this?
Firebot is an app for use by streamers on Mixer.com. It allows any streamer to quickly and easily setup interactive controls for their channel. It supports sound board buttons, api buttons, game controls, scene changes, group changes, and more all on the same interactive board at the same time. This allows any user to have a variety of fun buttons for their audience to interact with at any time.

## Can I use it now?
Yes, just head on over to [the releases page](https://github.com/Firebottle/Firebot/releases) and download the newest version!

## But how do I use it?
Check out the getting started guide over at [the wiki](https://github.com/Firebottle/Firebot/wiki/Getting-Started) which also has a video tutorial.

## I found a bug, who do I contact?
Just head over to the [issues](https://github.com/Firebottle/Firebot/issues) page and create a new issue.

## I have a new feature idea!
Submit feature requests at the [issues](https://github.com/Firebottle/Firebot/issues) page. Please note that this is a very general purpose app and not all feature requests will be kept.

## License
This code (everything in the repository) is provided under the GNU General Public License v3.0. This means that you're free to take the code in this repository and modify it in whatever way you like and distribute this code for any purpose. However, if you release it then it must be under this same license, make it open source, and provide documentation of changes made. All versions must have copyright credit pointing back to this source.

**Anything using this code must be under the GNU Public License, and a copyright credit must point back here.**
