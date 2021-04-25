import express, { Application, NextFunction, Request, Response } from 'express';
import { deleteLocalFiles, filterImageFromURL } from './util/util';

// const http = require('http');

(async () => {

  // Init the Express application
  const app: Application = express();

  // Set the network port
  const port = process.env.PORT || 8082;
  // could have added a type to port but felt unnecessary, i.e.
  // const port: number = parseInt(process.env.PORT) || 8082;

  // Use the express parser middleware for post requests
  // This replaces the deprecated bodyparser.json
  app.use(express.json());

  // GET /filteredimage?image_url={{URL}}
  // endpoint to filter an image from a public url.
  //    1. validate the image_url query
  //    2. call filterImageFromURL(image_url) to filter the image
  //    3. send the resulting file in the response
  //    4. deletes any files on the server on finish of the response
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]

  /**************************************************************************** */
  app.get('/filteredimage/', async (req: Request, res: Response) => {
    // @TODO how do I type Image URL as string to avoid toString 
    let { image_url } = req.query;

    // check image URL is provided
    if (!image_url) {
      console.log(`Image URL not provided`);
      return res.status(400).send({ status: 400, error: 'Image URL query parameter is required' });
    }
    console.log(`Image URL ${image_url}`);


    // check image URL is a valid URL and exists
    try {
      const imageURL: URL = new URL(image_url.toString());

      // @TODO check url exists - the following does not work
      // let imageURLExists: boolean = await new Promise(resolve => {
      //   http.request({ method: 'HEAD', host: imageURL.host, port: imageURL.port, path: imageURL.pathname }, (result: { statusCode: number; }) =>
      //     resolve(result.statusCode >= 200 && result.statusCode < 300)
      //   ).on('error', resolve).end();
      // });

      // if (!imageURLExists) {
      //   console.log(`Error - not found`);
      //   return res.status(422).send({ status: 422, error: 'Unprocessable Entity - Image not found' });
      // }

    } catch (e) {
      console.log(`Error - malformed URL`);
      return res.status(400).send({ status: 400, error: 'Malformed Image URL' });
    }
    console.log(`Valid image URL`);


    // filter the image and save file locally
    const filteredImageFilePath: string = await filterImageFromURL(image_url.toString());
    console.log(`Filtered image file path ${filteredImageFilePath}`);

    // send the filtered image in the response
    res.sendFile(filteredImageFilePath, async () => {
      // Remove the locally saved file
      try {
        await deleteLocalFiles([filteredImageFilePath]);
        console.log(`Deleted file`);
      } catch (e) {
        console.log(`Error deleting file`);
      }
    });
    console.log(`Filtered Image sent`);

  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{URL}}")
  });

  // this matches all routes and all methods that are not supported
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(404).send({ status: 404, error: "Unsupported call" })
  })

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();