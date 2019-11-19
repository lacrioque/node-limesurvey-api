# LimeSurvey JSON-RPC Interface

## CLI Usage
By just running the cli you can call any method on your rpc.

Start by defining the url, username and password for your api by calling:

    ```node index.js setup [your url] [your username] [your password]```

After that you can use either an export to file or a run and return command

    ```node index.js run [apicommand] [parameters]```

    ```node index.js runExport [command] [filename] [parameters]```

If you need help run ```node index.js --help```

## Import class

Part of this repository are two classes, one to be used with nodejs, and one that can be imported into another application.

Example:
```
import LSAPI from './LimeAPI.es6.js'

const limeAPI = new LSAPI(config = {
    url: "[yoururl]",
    credentials: {
        username: "[yourusername]",
        password: "[yourpassword]"
    }
}, debug=0);

await limeAPI.getAuthToken();
let result;
try {
    result = await limeAPI.runCall(
        "[method_of_limesurvey_rpc]", 
        ["array", "of", "parameters"]
    );
} catch(e) {
    //Here be error reporting
}

console.log(result);

```