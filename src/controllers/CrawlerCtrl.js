import cheerio from "cheerio";
import puppeteer from "puppeteer";
import {validationResult} from "express-validator";

const BASE_URL = "https://myreservations.omnibees.com";
let url = '';
const getData = async (checkin = null, checkout = null) => {
  try {
    url = `${BASE_URL}/default.aspx?q=5462&version=MyReservation#/&diff=false&CheckIn=${checkin}&CheckOut=${checkout}`;

    const browser = await puppeteer.launch({
      args: ["--no-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle0" });

    const content = await page.content();
    await browser.close();

    return content;
  } catch (error) {
    console.log(error);
  }
};

const formatDate = date => {
  return date.split("/").join("");
};

const findRoomsByDate = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty())
    return res.status(422).json({ errors: errors.array() });
  
  try {
    const { checkin, checkout } = req.body;
    const $ = cheerio.load(
      await getData(formatDate(checkin), formatDate(checkout))
    );
    
    const rooms = [];
    const items = [];
  
    const browser = await puppeteer.launch({
      args: ["--no-sandbox"]
    });
  
    
    $("div.roomExcerpt").each( async (index, item) => {
      items.push(item);
    });
    const promises = items.map( async (item) => {
      const modalItens = [];
      const services = [];
      const imgs = [];
      const modalUrl = BASE_URL + $(item).find("h5 a").attr("href");
     
      
      let room = {};
  
      room.name = $(item)
        .find("h5 a")
        .text()
        .trim();
      
      room.link = url;
      const page = await browser.newPage();
      await page.goto(modalUrl, { waitUntil: "networkidle0" });
      const modalContent = await page.content();
      const cheerioPage = cheerio.load(modalContent);
      cheerioPage(".columnLeft").each( async (index, item) => {
        modalItens.push(item)
      });
      
      modalItens.map( item => {
        room.fullDescription = cheerioPage(item).find('.roomDescription').text().trim();
        cheerioPage(item).find('.room_amenities li').each((index, item) => {
          services.push(cheerioPage(item).text().trim())
        })
      });
      room.service = services;

      room.price = $(item)
        .find("h6.bestPriceTextColor")
        .text()
        .trim();
  
      room.description = $(item)
        .find("a.description")
        .text()
        .trim();

      $(item)
        .find("a.fancybox-thumbs")
        .each(function(i, e) {
          imgs.push(
            `${BASE_URL}${$(e)
              .find("img")
              .attr("src")}`
          );
        });
  
      room.image = imgs;
      rooms.push(room);
    });
  
    await Promise.all(promises);
    await browser.close();
    
    return await res.json(rooms);
  } catch (error) {
    console.log(error);
  }
};

export default findRoomsByDate;
