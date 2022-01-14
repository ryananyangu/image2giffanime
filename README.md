# Animated fade away gifs from image

This is a small project that showcases the usage of cloudinary api's
in combination with typescript nextjs to transform and image to gif as a fadeout.

## Project initialization and setup

### Initiatilization of next js with typescript project

First we initialize an empty next js project.
Using the commands below. The command will prompt you to name your project.

```bash
npx create-next-app@latest --typescript
# or
yarn create next-app --typescript
```

Once initialization is complete you can confirm that initial setup is complete by running.

```bash
yarn dev
# OR
npm run dev
```

After running the above command visit [localhost port 3000](http://localhost:3000)

## Dependancies definations and additions

1. html2canvas
2. cloudinary
3. gifshot
4. styled-components

```bash
yarn add html2canvas
yarn add gifshot
yarn add cloudinary
yarn add styled-components
```

Additonal setup for gifshot

Add the following line of code in ./pages/api/decs.d.ts file
To enable import and export of the module within the project

```ts
declare module "gifshot";
```

## Cloudinary environment setup

Initialize instance of cloudinary module with configs/secrets from
that were setup in the .env file. in the root directoty.

```js
var cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});
```

## Development steps

- [X] Setup demonstration image in public folder.
- [X] link the image to an image tag in App class renderer
- [X] Retrieve the html image tag and convert the element to canvas using html2canvas library
- [X] Generate 6 other canvases (Due to storage contrainsts) while fading out the pixels in each canvas.
- [X] Take the generated list of canvases convert them into data urls array
- [X] Combine the images to gif using gifshot library
- [X] Upload the generated video/gif to cloudinary for storage.
- [X] Display the generated fadeout/disintegration gif

### link the image to an image tag in App class renderer

```tsx
<Main>
    <div className="inner">
        {loading ? (
        <div>Processing ... </div>
        ) : (
        <Image
            id="world"
            src={gif_image ? gif_image : `/goat.jpg`}
            alt=""
        />
        )}
        <br />
        {url ? <div>{url}</div> : ""}
        {!loading && <button onClick={this.snap.bind(this)}>Snap</button>}
    </div>
</Main>
```

### Retrieve the html image tag and convert the element to canvas using html2canvas library

```ts
// convert img tag to canvas
const canvas = await html2canvas(img as HTMLElement);
const ctx = canvas.getContext("2d");
if (!ctx) return;
// Getting image data from the canvas for pixel manupilation
const image_data = ctx.getImageData(0, 0, canvas.width, canvas.height);
if (!image_data) return;
const pixel_arr = image_data.data;
```

### Generate 6 other canvases while fading out the pixels in each canvas

```ts
const image_data_array = this.createBlankImageArray(image_data);
//put pixel info to imageDataArray (Weighted Distributed)
for (let i = 0; i < pixel_arr.length; i++) {
    const p = Math.floor((i / pixel_arr.length) * CANVAS_COUNT);

    const dist = Math.round(Math.random() * (CANVAS_COUNT - 1));

    const a = image_data_array[dist];
    a[i] = pixel_arr[i];
    a[i + 1] = pixel_arr[i + 1];
    a[i + 2] = pixel_arr[i + 2];
    a[i + 3] = pixel_arr[i + 3];
}
```

### Take the generated list of canvases convert them into data urls array

```ts
// fadeout image list generation and mapping
const images = new Array(CANVAS_COUNT)
    .fill(0)
    .map((_, i) =>
    this.createCanvasFromImageData(
        image_data_array[i],
        canvas.width,
        canvas.height
    ).toDataURL()
    );
```

### Combine the images to gif using gifshot library

```ts
gifshot.createGIF(
    {
        images,
        gifWidth: canvas.width,
        gifHeight: canvas.height,
        numFrames: CANVAS_COUNT
    },
    (obj: any) => {
        if (obj.error) {
            console.log(obj.error);
            return;
        }
        console.log(obj.image);
        this.uploadVideoCloudinary(obj.image);
        this.setState({ gif_image: obj.image, loading: false });
    }
);
```

### Upload the generated video/gif to cloudinary for storage

```ts
// https://rv7py.sse.codesandbox.io/
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method === "POST") {
    let fileStr: string = req.body.data;
    let uploadResponse: any;

    try {
      uploadResponse = await cloudinary.uploader.upload_large(fileStr, {
        resource_type: "auto",
        chunk_size: 6000000,
        timeout: 60000
      });
      console.log(uploadResponse);
    } catch (err) {
      console.log(err);
    }
    res.status(200).json({ name: "" + uploadResponse.secure_url });
  }
}
```
