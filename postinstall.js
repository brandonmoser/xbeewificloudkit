var spawn = require('child_process').spawn;

var platform = process.platform;

var bower_child, grunt_child;

var bower_path, grunt_path;
var is_windows = false;

if (platform === "win32") {
    is_windows = true;
    bower_path = ".\\node_modules\\bower\\bin\\bower";
    grunt_path = ".\\node_modules\\grunt-cli\\bin\\grunt";
} else {
    // We reach this case if the user is not running Windows, i.e. they are
    // running Linux, or Mac OS, or something else. Windows seems to be the
    // only platform which we need to special-case out. We can't assume "bower"
    // and "grunt" will be on the PATH, because we might be running on Heroku.
    // Therefore, bower_path and grunt_path must reference the binaries in
    // node_modules/
    is_windows = false;
    bower_path = "./node_modules/bower/bin/bower";
    grunt_path = "./node_modules/grunt-cli/bin/grunt";
}

function spawn_command(cmd, args) {
    // spawn can only be used to run .exe files. So we have to detect if we're
    // on Windows, and, if so, call spawn(cmd /c <cmd> <args>) instead.
    // http://stackoverflow.com/a/18334540
    if (is_windows) {
        // Spawn cmd /c node <cmd>, because the commands we're running (grunt
        // and bower) are actually Node scripts
        return spawn("cmd", ["/c", "node", cmd].concat(args));
    } else {
        return spawn(cmd, args);
    }
}

console.log("Running bower install" + (is_windows ? " ON WINDOWS" : ""));
bower_child = spawn_command(bower_path, ["install", "--no-color"]);
bower_child.stdout.on("data", function (data) {
    console._stdout.write(data.toString());
});
bower_child.stderr.on("data", function (data) {
    console._stderr.write(data.toString());
});
bower_child.on("exit", function (code, signal) {
    if (code) {
        console.log("'bower install' exited with error code " + code);
        // Abort postinstall
        process.exit(1);
    } else {
        // Install succeeded.
        console.log("Running grunt heroku:production" + (is_windows ? " ON WINDOWS" : ""));
        grunt_child = spawn_command(grunt_path, ["heroku:production"]);
        grunt_child.stdout.on("data", function (data) {
            console._stdout.write(data.toString());
        });
        grunt_child.stderr.on("data", function (data) {
            console._stderr.write(data.toString());
        });
        grunt_child.on("exit", function (code, signal) {
            if (code) {
                console.log("'grunt heroku:production' exited with error code " + code);
                process.exit(1);
            } else {
                console.log("postinstall complete.");
            }
        })
    }
});
