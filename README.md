# Heatmap Coding Challenge

## Setup

This repository uses Grunt to serve files locally. 

You can set it up using

```
npm install
```

## Running the project

Then, once installed, you can use

```
grunt
```

to run the project locally.

## How it works

When the script is loaded, it automatically starts tracking `mousemove` events and storing them in a Javascript object, which is persisted to a remote server.

Users can press `SHIFT + H+M` to toggle the heatmap on and off.


## What the script does

There is an object called `currentData`, which stores information needed to render the heatmap.

When a user moves the mouse, a value is incremented inside `currentData.store`.

Every 10 seconds, the data from `currentData.store` is processed into the format requred by the heatmap rendering library, and moved into `currentData.data`.

Now that it's ready, it is sent to the server via POST.


## Dealing with large datasets

Since the dataset can become very large, the `compactData()` function exists to compact the data and drop some counts that are very low.

## Heatmap rendering

The heatmaps are rendered using **Heatmap.js**, which can be found here: https://www.patrick-wied.at/static/heatmapjs/docs.html

# Coding Challenge

Feel free to ask as many questions as you need. I can join you on chat to explain anything you need.


1. Currently, you must press `SHIFT + H+M` to toggle the heatmap on and off. Change this to  `CTRL + SHIFT + H`.

2. Currently, the user must set a project ID (`window._GumshoeProject`). Since we are already using the **md5** library, let's just use an `md5()` of `location.hostname` instead.

3. Currently, `mousemove`, `click`, and `touchstart` all are tracked equally (line 297). But, we think Clicks and Taps are more important. Create a separate event listener for `click` and `touchstart` events so they can get 10 points of value instead of just 1.
