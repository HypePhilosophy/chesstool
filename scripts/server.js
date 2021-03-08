/* eslint-disable*/
var http = require("http"),
    url  = require("url"),
    path = require("path"),
    fs   = require("fs"),
    port = process.argv[2] || 8080; /// Defaults to port 8080

function get_mime(filename)
{
    var ext = path.extname(filename);
    
    if (ext === ".html" || ext === ".htm") {
        return "text/html";
    } else if (ext === ".css") {
        return "text/css";
    } else if (ext === ".js") {
        return "application/javascript";
    } else if (ext === ".png") {
        return "image/png";
    } else if (ext === ".jpg" || ext === ".jpeg") {
        return "image/jpeg";
    } else if (ext === ".gif") {
        return "image/gif";
    } else if (ext === ".pdf") {
        return "application/pdf";
    } else if (ext === ".webp") {
        return "image/webp";
    } else if (ext === ".txt") {
        return "text/plain";
    } else if (ext === ".svg") {
        return "image/svg+xml";
    } else if (ext === ".xml") {
        return "application/xml";
    } else if (ext === ".bin") {
        return "application/octet-stream";
    } else if (ext === ".ttf") {
        return "application/x-font-ttf";
    } else if (ext === ".woff") {
        return "application/font-woff";
    }
}

/// Start the server.
http.createServer(function (request, response)
{
    var cwd = process.cwd(),
        filename,
        uri = url.parse(request.url).pathname;
    
    filename = path.join(cwd, uri);
    
    /// Make sure the URI is valid and withing the current working directory.
    if (uri.indexOf("/../") !== -1 || uri[0] !== "/" || path.relative(cwd, filename).substr(0, 3) === "../") {
        response.writeHead(404, {"Content-Type": "text/plain"});
        response.write("404 Not Found\n");
        response.end();
        return;
    }
    
    fs.exists(filename, function (exists)
    {
        /// If the URI does not exist, display a 404 error.
        if (!exists) {
            response.writeHead(404, {"Content-Type": "text/plain"});
            response.write("404 Not Found\n");
            response.end();
            return;
        }
        
        /// If the URI is a directory, try to load index.html.
        if (fs.statSync(filename).isDirectory()) {
            filename += "/index.html";
        }
        
        fs.readFile(filename, "binary", function (err, file)
        {
            var mime;
            
            /// If the file cannot be loaded, display a 500 error.
            if (err) {
                response.writeHead(500, {"Content-Type": "text/plain"});
                response.write(err + "\n");
                response.end();
                return;
            }
            
            mime = get_mime(filename);
            
            /// If the file loads correctly, write it to the client.
            response.writeHead(200, mime ? {"Content-Type": mime} : undefined);
            response.write(file, "binary");
            response.end();
        });
    });
}).listen(parseInt(port, 10));

console.log("Static file server running at\n  => http://localhost:" + port + "/\nCTRL + C to shutdown");