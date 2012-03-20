/**
 * jquery.Jcrush.js v1.0.0
 * jQuery Image Crushing Plugin
 * @author Arthur Rio <arthur@punchtab.com>
 * Copyright (c) 2012 Arthur Rio
 */

(function ($) {

    $.Jcrush = function (obj, opt) {
        var options = $.extend({}, $.Jcrush.defaults),
            $origimg, $img, $wrapper, $anchor,
            image_w, image_h;

        // Internal Methods

        function px(n) {
            return parseInt(n, 10) + 'px';
        }


        var Coords = (function () {
            var x = 0,
                y = 0,
                w = 0,
                h = 0;

            function getSelection() {
                return {x: x, y: y, w: w, h: h};
            }
            
            function setSelection(box) {
                x = box[0];
                y = box[1];
                w = box[2];
                h = box[3];
            }

            function getSelectionSize() {
                return [w, h];
            }

            function setSelectionSize(dim) {
                w = dim[0];
                h = dim[1];
            }

            function getSelectionOrigin() {
                return [x, y];
            }
            
            function setSelectionOrigin(pos) {
                x = pos[0];
                y = pos[1];
                options.onChange.call(api, Coords.getSelection());
            }

            return {
                getSelection: getSelection,
                setSelection: setSelection,
                getSelectionSize: getSelectionSize,
                setSelectionSize: setSelectionSize,
                getSelectionOrigin: getSelectionOrigin,
                setSelectionOrigin: setSelectionOrigin
            };
        }());

        function setOptions(opt) {
            if (typeof(opt) !== 'object') {
                opt = {};
            }
            options = $.extend(options, opt);

            if (typeof(options.onChange) !== 'function') {
                options.onChange = function () {};
            }
            if (typeof(options.onSelect) !== 'function') {
               options.onSelect = function () {};
            }
            if (typeof(options.onRelease) !== 'function') {
               options.onRelease = function () {};
            }

            Coords.setSelection([
                    options.selectionOriginX,
                    options.selectionOriginY,
                    options.selectionWidth,
                    options.selectionHeight
            ]);

            options.crushID = parseInt(Math.random()*1000000, 10);

        }


        // Initialization {{{
        // Sanitize some options
        if (typeof(obj) !== 'object') {
          obj = $(obj)[0];
        }
        if (typeof(opt) !== 'object') {
          opt = {};
        }

        $origimg = $(obj);

        
        function ready() {
            // set the options
            setOptions(opt);

            var draggable = image_w > options.selectionWidth || image_h > options.selectionHeight;

            loadJcrush(draggable);
        }


        function cloneImage() {
            img = new Image();
            $img = $(img);
            $img.load(function () {
                // Unbind to stop 
                $img.unbind();

                // save the dimensions of the image
                image_w = $origimg.width();
                image_h = $origimg.height();

                $img.attr('id', '');
                $img.css('display', 'block');

                ready();

            });

            // clone what we need from the original image
            $img.attr('class', $origimg.attr('class')).attr('src', $origimg.attr('src'));
        }

        cloneImage();
        
        function moveImage(x, y) {
            var size = Coords.getSelectionSize(),
                frame_x = image_w - size[0],
                frame_y = image_h - size[1];
            Coords.setSelectionOrigin([x, y]);
            $img.css('left', px(frame_x - x));
            $img.css('top', px(frame_y - y));
        }

        function createWrapper(draggable) {

            var size = Coords.getSelectionSize(),
                origin = Coords.getSelectionOrigin(),
                frame_x = image_w - size[0],
                frame_y = image_h - size[1],
                image_classes = $img.attr('class');

            $wrapper = $(document.createElement('div'));
            $wrapper.attr('id', 'crush_wrapper' + options.crushID);
            $wrapper.css('position', 'absolute');
            $wrapper.width(image_w + frame_x);
            $wrapper.height(image_h + frame_y);
            $wrapper.css('cursor', options.cursor);
            $wrapper.css('clip', 'rect(' + px(frame_y)+ ',' + px(image_w) + ',' + px(image_h) + ',' + px(frame_x) + ')');
            $wrapper.css('left', '-' + px(frame_x));
            $wrapper.css('top', '-' + px(frame_y));

            $anchor = $(document.createElement('div'));
            $anchor.attr('id', options.anchor + options.crushID);
            $anchor.addClass(image_classes);
            $anchor.css('position', 'relative');
            $anchor.css('overflow', 'hidden');
            $anchor.css('width', px(size[0]));
            $anchor.css('height', px(size[1]));
            $anchor.css('display', 'block');
            $anchor.append($wrapper);

            // remove all the style on the image and move it to the 
            $img.attr('class', '');
            moveImage(origin[0], origin[1]);

            $wrapper.append($img);

            // if draggable and tell to do so, show the hit to say to the user he can drag to reposition
            if (draggable && options.allowMove && options.showHint) {
                $hint = $(document.createElement('label'));
                // for top and left size[A] - B : B represent height of the hit + padding
                $hint.css('position', 'absolute')
                    // 80 represents the width of the hint + padding
                    .css('left', px(frame_x + ((size[0] - 80) / 2)))
                    // 44 represents the height of the hint + padding
                    .css('top', px(frame_y + ((size[1] - 44)/2)))
                    .css('font-size', '14px')
                    .css('width', '70px')
                    .css('height', '34px')
                    .css('background-color', '#434343')
                    .css('color', 'white')
                    .css('cursor', options.cursor)
                    .css('opacity', '0.7')
                    .css('border-radius', '8px')
                    .css('padding', '5px');

                $hint.html(options.hintMessage);


                // Redirect the click on the hint on the image to drag it (equivalent to clicking through the hint)
                $hint.disableSelection().mousedown(function (e) {
                    $img.trigger(e);
                    return false;
                });

                $wrapper.append($hint);

            }

            $origimg.replaceWith($anchor);

        }

        function handleDrag(event, ui) {
            // Fix bug for firefox
            var userAgent = navigator.userAgent.toLowerCase(),
                current_top = $(window).scrollTop();

            var offset_x = parseInt(ui.position.left, 10),
                offset_y = parseInt(ui.position.top, 10),
                size = Coords.getSelectionSize();

            if(userAgent.match(/firefox/)) {
                offset_y += current_top;
            }

            x = $img.width() - (offset_x + size[0]);
            y = $img.height() - (offset_y + size[1]);

            Coords.setSelectionOrigin([x, y]);
        }

        function allowMove(bool) {
            $img.draggable( "option", "disabled", !bool);
        }

        function loadJcrush(draggable) {

            if (!draggable || !options.allowMove) {
                options.cursor = 'standard';
            }

            createWrapper(draggable);

            $img.draggable({
                containment: 'parent',
                cursor: options.cursor,
                drag: handleDrag
            });
            $(document).scroll(function () {
                $(document).trigger("mouseup");
            });

            // Fix bug for firefox
            var userAgent = navigator.userAgent.toLowerCase(),
                current_top;

            if(userAgent.match(/firefox/) && options.allowMove) {
                $img.bind( "dragstart", function (event, ui) {
                    current_top = $(window).scrollTop();
                    $(this).css('margin-top', current_top);
                });
                $img.bind( "dragstop", function (event, ui) {
                    $(this).css('margin-top', '');
                    $(this).css('top', px(current_top + parseInt($(this).css('top'), 10)));
                });
            }

            allowMove(options.allowMove && draggable);

        }

        function updateImage(url) {

            // make sure there is no binding
            $origimg.unbind();

            options.cursor = 'move';
            opt.selectionOriginX = 0;
            opt.selectionOriginY = 0;

            $origimg.load(function () {
                
                $origimg.unbind();

                cloneImage();

            });
            
            $origimg.attr('src', url);
            $origimg.hide();
            $anchor.replaceWith($origimg);

        }

        var api = {
            allowMove: allowMove,
            moveImage: moveImage,
            updateImage: updateImage
        };

        return api;
    };

    // Global Defaults
    $.Jcrush.defaults = {

        // Basic Settings
        allowMove: true,
        showHint: true,
        hintMessage: 'Drag to reposition',

        // Callbacks / Event Handlers
        onChange: function () {},
        onSelect: function () {},
        onRelease: function () {},

        // Position attributes
        selectionHeight: 300,
        selectionWidth: 300,
        selectionOriginX: 0,
        selectionOriginY: 0,
        
        // cursor
        cursor: 'move',

        // name of the anchor
        anchor: "crush_container"
    };

    // Function to disable the selection of a text element
    $.fn.disableSelection = function() {
        return this.each(function() {
            $(this).attr('unselectable', 'on')
               .css({
                   '-moz-user-select':'none',
                   '-webkit-user-select':'none',
                   'user-select':'none',
                   '-ms-user-select':'none'
               })
               .each(function() {
                   this.onselectstart = function() { return false; };
               });
        });
    };

  // }}}
}(jQuery));

