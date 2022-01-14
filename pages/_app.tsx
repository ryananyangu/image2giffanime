import React from "react"
import styled from "styled-components"
import html2canvas from "html2canvas"
import dynamic from "next/dynamic"
import gifshot from 'gifshot'



const CANVAS_COUNT = 6

interface Props { }

interface State {
  gif_image: string | null
  loading: boolean
  url: string | null
}

class App extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      gif_image: null,
      loading: false,
      url: null
    }
  }

  async snap() {
    const { gif_image } = this.state
    if (gif_image) return
    const img = document.querySelector("#world")
    if (!img) {
      return
    }

    this.setState({ loading: true })

    const canvas = await html2canvas(img as HTMLElement)

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const image_data = ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    )
    // const start = Date.now() / 1000
    if (!image_data) return
    const pixel_arr = image_data.data

    const image_data_array =
      this.createBlankImageArray(image_data)
    //put pixel info to imageDataArray (Weighted Distributed)
    for (let i = 0; i < pixel_arr.length; i++) {
      const p = Math.floor(
        (i / pixel_arr.length) * CANVAS_COUNT
      )

      const dist = Math.round(
        Math.random() * (CANVAS_COUNT - 1)
      )

      const a = image_data_array[dist]
      a[i] = pixel_arr[i]
      a[i + 1] = pixel_arr[i + 1]
      a[i + 2] = pixel_arr[i + 2]
      a[i + 3] = pixel_arr[i + 3]
    }

    const images = new Array(CANVAS_COUNT)
      .fill(0)
      .map((_, i) =>
        this.createCanvasFromImageData(
          image_data_array[i],
          canvas.width,
          canvas.height
        ).toDataURL()
      )


    gifshot.createGIF({
      images,
      gifWidth: canvas.width,
      gifHeight: canvas.height,
      numFrames: CANVAS_COUNT,
    }, (obj: any) => {
      if (obj.error) {
        console.log(obj.error)
        return
      }
      console.log(obj.image)
      this.uploadVideoCloudinary(obj.image)
      this.setState({ gif_image: obj.image, loading: false })

    })
  }

  uploadVideoCloudinary = async (request: string) => {
    console.log("uploading to backend...")
    try {
      fetch("/api/upload", {
        method: "POST",
        body: JSON.stringify({ data: request }),
        headers: { "Content-Type": "application/json" },
      }).then((response) => {
        response.json().then( data => {
           this.setState({url : data.name})
           console.log("successfull session", data.name);
        })
      });
    } catch (error) {
      console.error(error);
    }
  }

  createBlankImageArray(image_data: ImageData): Uint8ClampedArray[] {
    return new Array(CANVAS_COUNT)
      .fill(0)
      .map(() => new Uint8ClampedArray(image_data.data).fill(0))
  }

  createCanvasFromImageData(
    imageDataArray: Uint8ClampedArray,
    w: number,
    h: number
  ) {
    const canvas = document.createElement("canvas")
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext("2d")
    ctx?.putImageData(new ImageData(imageDataArray, w, h), 0, 0)
    return canvas
  }
  // https://cataas.com/cat?randomness=${Date.now()}

  render(): React.ReactNode {
    const { gif_image, loading, url } = this.state
    return (

      <Main>
        <div className="inner">
          {loading ? <div>Processing ... </div> : <Image id="world" src={gif_image ? gif_image : `/goat.jpg`} alt="" />}
          <br />
          {url ? <div>{url}</div> : ''}
          {!loading && <button onClick={this.snap.bind(this)}>Snap</button>}
        </div>
      </Main>

    )
  }
}

const Image = styled.img`
    height: 200px;
    width: 200px;
`

const Main = styled.div`
    width: 100%;
    .inner {
        max-width: 800px;
        margin: 20px;
        padding: 16px 10px;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-color: #ffffff;
        border-radius: 16px;
    }
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100vh;
    background-color: #eeeeee;
`

// Removes server side rendering for the specific component
export default dynamic(() => Promise.resolve(App), {
  ssr: false,
});