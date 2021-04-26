import express, { Application, NextFunction, Request, Response } from 'express';
import { deleteLocalFiles, filterImageFromURL } from './util/util';

const http = require('http');

(async () => {

  // Init the Express application
  const app: Application = express();

  // Set the network port
  const port: number = parseInt(process.env.PORT) || 8082;

  // Use the express parser middleware for post requests
  // This replaces the deprecated bodyparser.json
  app.use(express.json());

  // GET /filteredimage?image_url={{URL}}
  //    endpoint to filter an image from a public url.
  // QUERY PARAMATERS
  //    image_url: URL of a publicly accessible image
  // RETURNS
  //   the filtered image file [!!TIP res.sendFile(filteredpath); might be useful]
  app.get('/filteredimage/', async (req: Request, res: Response) => {

    const { image_url } = req.query as { image_url: string };

    // check image URL is provided
    if (!image_url) {
      const err_msg: string = 'Image URL query parameter is required';
      console.log(err_msg);
      return res.status(400).send({ status: 400, message: err_msg });
    }
    console.log(`Image URL ${image_url}`);


    // check image URL is a well-formed URL
    try {
      const imageURL: URL = new URL(image_url);
    } catch (e) {
      const err_msg: string = 'Malformed Image URL';
      console.log(err_msg);
      return res.status(400).send({ status: 400, message: err_msg });
    }


    // filter the image and save file locally
    try {
      const filteredImageFilePath: string = await filterImageFromURL(image_url);

      // send the filtered image in the response
      res.sendFile(filteredImageFilePath, async () => {

        // Remove the locally saved file
        try {
          await deleteLocalFiles([filteredImageFilePath]);
        } catch (e) {
          console.log(`Delete file ${e}`);
        }

      });

    } catch (e) {
      let err_msg: string = `Unprocessable Entity - `;

      if (e.toString().includes('Could not find MIME for Buffer <null>')){
        err_msg += `Error: image not found`;
      } else {
        err_msg += `${e}`;
      }

      console.log(err_msg);
      return res.status(422).send({ status: 422, message: err_msg });
    }

  });

  // Root Endpoint
  // Displays a simple message to the user
  app.get("/", async (req: Request, res: Response) => {
    res.send("try GET /filteredimage?image_url={{IMAGE-URL}}")
  });

  // this matches all routes and all methods that are not implemented
  app.use((req: Request, res: Response, next: NextFunction) => {
    res.status(501).send({ status: 501, message: "Not Implemented" })
  })

  // Start the Server
  app.listen(port, () => {
    console.log(`server running http://localhost:${port}`);
    console.log(`press CTRL+C to stop server`);
  });
})();