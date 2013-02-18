var qs = require('querystring');
var http = require("http");
var url = require("url");
var fs = require("fs");

// Create the server.
http.createServer(function (request, response) {

    if (request.method == 'POST') {

        //  Grab the body, fill it up with data as we get it
        //
        //  TODO: Make sure we limit the amount of data we recieve so
        //  people can't send it an endless file.
        var body = '';
        request.on('data', function (data) {
            body += data;
        });

        // Attach listener on end event.
        request.on('end', function () {

            //  get the nice response ready
            var result = {
                'status': 'error',
                'msg': 'Something went wrong'
            }

            //  get the POSTED data, and the params (so we can check for a callback)
            var POST = qs.parse(body);
            var params = url.parse(request.url, true).query;

            //  Check to see if we have some data, if so process it
            if ('data' in POST) {

                //  TODO: Get the frame number (need to check this exists)
                var frame = POST.frame.toString();

                //  Pad it
                if (frame.length == 3) frame = '0' + frame;
                if (frame.length == 2) frame = '00' + frame;
                if (frame.length == 1) frame = '000' + frame;

                //  try and dump the file down (once we've finished streaming the data, we could put all this
                //  up into the request.on and stream it to file as we get it... but yeah, let's not for the
                //  moment)
                try {
                    fs.writeFile('frames/frame' + frame + '.png', new Buffer(POST.data.replace('data:image/png;base64,',''), "base64"));
                    //  set the status JSON object we're going to return
                    result.status = 'ok';
                    result.msg = 'frame' + frame + '.png';

                    //  Log that we're getting something and saving it
                    //console.log('frame' + frame + '.png');
                } catch(er) {
                    //  update the error message in the result.
                    result.msg = 'Failed to write image to disk';
                }
            } else {
                result.msg = 'No image data passed';
            }

            //  If there was a callback then wrap it, otherwise lets not bother.
            if ('callback' in POST) {
                response.writeHead(200, {'Content-Type': 'text/plain', 'Access-Control-Allow-Origin' : '*'});
                response.end(params.callback + '(' + JSON.stringify(result) + ')');
            } else {
                response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin' : '*'});
                response.end(JSON.stringify(result));
            }

        });
    }

// Listen on the 8987 port.
}).listen(8987);