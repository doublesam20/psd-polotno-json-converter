// lambda/home.js
exports.handler = async (event, context) => {
  const message = event.queryStringParameters.message ? event.queryStringParameters.message : '';

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'text/html' },
    body: `
            <!doctype html>
            <html lang="en">
            <head>
                <!-- Required meta tags -->
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1">

                <!-- Bootstrap CSS -->
                <link href="https://stackpath.bootstrapcdn.com/bootstrap/5.0.0-beta1/css/bootstrap.min.css" rel="stylesheet">

                <title>Upload PSD</title>
            </head>
            <body>
                <div class="container vh-100 d-flex justify-content-center align-items-center">
                    <div class="row">
                        <div class="col-12 text-center" style="color: green">
                            <h1>${message}</h1>
                        </div>
                        <div class="col-12">
                            <form action="/.netlify/functions/upload" method="post" enctype="multipart/form-data">
                                <div class="mb-3">
                                    <label for="psd" class="form-label">Upload PSD</label>
                                    <input type="file" class="form-control" name="psd" id="psd">
                                </div>
                                <button type="submit" class="btn btn-primary">Upload</button>
                            </form>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `,
  };
};
