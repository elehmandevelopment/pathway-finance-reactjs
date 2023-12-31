import React, { useState, useEffect, useRef } from 'react';
import { createChart } from 'lightweight-charts';
// import { priceData } from './priceData/priceData';
import { Link } from 'react-router-dom';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai'
import { TbStarsFilled } from 'react-icons/tb'
import { addCryptoFavorite, removeCryptoFavorite } from './favoriteSlice';
import { useDispatch, useSelector } from 'react-redux';
const TradingPortalCrypto = () => {
    const [searchResults, setSearchResults] = useState([]);
    const [searchSymbol, setSearchSymbol] = useState("");
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [priceData, setPriceData] = useState(null)
    const [cryptoName, setCryptoName] = useState("BTC");
    const [showDropdown, setShowDropdown] = useState(false);

    const dispatch = useDispatch();

    const favorites = useSelector((state) => state.favorites.cryptoFavorites)

    const API_KEY = process.env.REACT_APP_API_KEY;

    useEffect(() => {
        const handleWindowResize = () => {
            setWindowWidth(window.innerWidth);
        };

        window.addEventListener('resize', handleWindowResize);

        // return a cleanup function to remove the event listener when the component unmounts
        return () => {
            window.removeEventListener('resize', handleWindowResize);
        };
    }, []);

    async function handleSubmit(event) {
        event.preventDefault();

        console.log('searching tickers');

        // Reset price data
        setPriceData(null);

        const response = await fetch(`https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${searchSymbol}&market=USD&apikey=${API_KEY}`);
        const data = await response.json();

        if(data['Meta Data']){
            const result = {
                symbol: data['Meta Data']['2. Digital Currency Code'],
                name: data['Meta Data']['3. Digital Currency Name']
            };

            setSearchResults([result]);
        } else {
            setSearchResults([]);
            alert('No matching coin found. Not all crypto is supported at this time.')
        }
    }

    // fetch stock history
    async function fetchCrypto(symbol) {
        const response = await fetch(`https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY&symbol=${symbol}&market=USD&apikey=${API_KEY}`);
        const data = await response.json();
        const timeSeries = data['Time Series (Digital Currency Daily)'] || {};
        let tradingDays = 0;
        let stockData = [];
        for(let key in timeSeries){
            if(tradingDays >= 2555){ // ~7 trading yrs
                break;
            }
            stockData.push({
                time: key,
                open: parseFloat(timeSeries[key]['1b. open (USD)']),
                high: parseFloat(timeSeries[key]['2b. high (USD)']),
                low: parseFloat(timeSeries[key]['3b. low (USD)']),
                close: parseFloat(timeSeries[key]['4b. close (USD)']),

            });
            tradingDays++;
        }
        // Update priceData state with stock data
        return stockData.reverse();
    }

    useEffect(() => {
        // Fetch BTC data on component mount
        fetchCrypto('BTC').then(data => setPriceData(data));
    }, []); // Empty array ensures this runs only once on mount

    // reference to the div containing the chart:
    const chartContainerRef = useRef(); 
    const chartRef = useRef(null);

    useEffect(() => {
        if (priceData === null) { 
            return; // If there is no data, do not create the chart
        }

        console.log(`rendering chart`);

        if(chartRef.current){
            chartRef.current.remove();
            chartRef.current = null;
        }

        // Create a new chart:
        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#000033' },
                textColor: '#DDD'
            },
            grid: {
                vertLines: { color: '#444' },
                horzLines: { color: '#444' }
            },
            watermark: {
                visible: true,
                fontSize: 24,
                horzAlign: 'center',
                vertAlign: 'bottom',
                color: 'rgb(0, 123, 255, 0.8)',
                text: cryptoName,
            },
        })

        // Save reference to new chart
        chartRef.current = chart;

        // convert candlestick data for use w/ a line series:
        const lineData = priceData.map(datapoint => ({
            time: datapoint.time,
            value: (datapoint.close + datapoint.open) / 2,
        }));

        // Add an area series to the chart,
        // Adding this before we add the candlestick chart
        // so that it will appear beneath the candlesticks
        const areaSeries = chart.addAreaSeries({
            lastValueVisible: false, // hide the last value marker for this series
            crosshairMarkerVisible: false, // hide the crosshair marker for this series
            lineColor: 'transparent', // hide the line
            topColor: 'rgba(56, 33, 110,0.6)',
            bottomColor: 'rgba(56, 33, 110, 0.1)',
        });
        // Set the data for the Area Series
        areaSeries.setData(lineData);

        // Create the Main Series (Candlesticks)
        // sample data w/ candlestick series:
        const mainSeries = chart.addCandlestickSeries();
        mainSeries.setData(priceData);

        // auto resize the chart:
        const resizeObserver = new ResizeObserver(entries => {
            window.requestAnimationFrame(() => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    chart.resize(width, height);
                }
            });
        });

        resizeObserver.observe(chartContainerRef.current);

        // clean up unmount
        return () => {
            if (chartContainerRef.current) {
                resizeObserver.unobserve(chartContainerRef.current);
            }
        };
    }, [priceData]);

    const handleClickFavorite = async (symbol) => {
        try {
            const symbolStripped = symbol.replace("$", "")
            const data = await fetchCrypto(symbolStripped);
            setPriceData(data);
            setCryptoName('$' + symbolStripped);
            setShowDropdown(false);
        } catch (err) {
            console.error(err);
        }
    };

  return (
    <>
    <div className='fixed w-full h-20 bg-gradient-to-r from-[#212121] to-[#000033] z-[100] border-b border-[#DDD]'>
        <div className='flex justify-between items-center w-full h-full px-2 2xl:px-16'>
            <div className='flex items-center' >
            <Link to='/' smooth={true} duration={500} className='cursor-pointer mr-2 sm:mr-6'>
                <img src="/assets/path-white.png" alt="/" width='87' height='37' />
            </Link>
                <h4 className='text-sm sm:text-xl mr-1 sm:mr-2 text-white font-normal flex items-center justify-end'>Search Ticker:</h4>
                <div className='search-wrapper'>
                    <form onSubmit={handleSubmit} className='flex items-center font-semibold'>
                        <input 
                            type="search" 
                            value={searchSymbol} 
                            onChange={e => setSearchSymbol(e.target.value)} 
                            className='text-sm sm:text-base sm:px-2 h-6 sm:h-8 rounded-md' 
                        />
                        <input type="submit" value="Submit" className='border-2 text-white bg-transparent text-sm sm:text-base cursor-pointer hover:scale-105 ease-in duration-200 p-px sm:p-1 rounded-lg flex items-center justify-center mx-1 my-px shadow-md font-semibold tracking-wider' />
                    </form>
                    {searchResults.length > 0 && (
                        <div className='dropdown bg-transparent fixed text-black font-semibold rounded-lg sm:text-base text-sm'>
                            {searchResults.map((result, index) => {
                                let isFavorite;
                                if(!favorites){
                                    isFavorite = false;
                                } else {
                                    isFavorite = favorites.some(fav => fav.symbol === `$${result.symbol}`);
                                }
                                

                            return (
                                <div 
                                key={index} 
                                id={result.symbol} 
                                className='bg-white rounded-md dropdown-item border p-1 w-full cursor-pointer hover:scale-105 ease-in duration-200 flex items-center'
                                onClick={async (e) => {
                                    // check if event is star:
                                    if(e.target.closest('svg')){
                                        return;
                                    }
                                    try{
                                        const data = await fetchCrypto(result.symbol);
                                        setPriceData(data);
                                        setCryptoName(result.name || '$' + result.symbol)
                                        setSearchResults([]);
                                    } catch (err){
                                        console.error(err);
                                    }
                                }}
                                >
                                    {result.symbol} - {result.name}

                                    {/* Render the correct star based on whether it's a favorite */}
                                    {isFavorite ? 
                                        <AiFillStar 
                                        className='w-10 text-yellow-400 hover:scale-125 ease-in duration-200 cursor-pointer'
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(removeCryptoFavorite({symbol: `$${result.symbol}`}));
                                        }}
                                        /> 
                                    : 
                                        <AiOutlineStar 
                                        className='ml-2 hover:scale-125 ease-in duration-200'
                                        onClick={(e) =>{
                                            e.stopPropagation();
                                            dispatch(addCryptoFavorite({symbol: `$${result.symbol}`}));
                                        }}
                                        />
                                    }
                                </div>
                            );
                            
                        })
                        }
                        </div>
                    )}
                </div>
            </div>
            <div className='text-white text-xl flex items-center justify-center'>
                {windowWidth > 1020 ? (
                <>
                Favorites: 
                {favorites && favorites.map((fav, index) => (
                <div
                    id={fav.symbol}
                    className='border bg-transparent text-lg p-2 rounded-lg hover:scale-105 ease-in duration-300 w-full flex items-center justify-center mx-2 shadow-md font-semibold tracking-wider'
                    key={index} // Best practice is to add a key when mapping
                >
                    <button
                        onClick={async () => {
                            try{
                                const symbol = fav.symbol.replace("$", "")
                                const data = await fetchCrypto(symbol);
                                setPriceData(data);
                                setCryptoName('$' + symbol);
                            } catch (err){
                                console.error(err);
                            }
                        }}
                    >
                        {fav.symbol}
                    </button>
                    <AiFillStar 
                        className='w-10 text-yellow-400 hover:scale-125 ease-in duration-200 cursor-pointer' 
                        onClick={(e) => {
                            e.stopPropagation(); // stops the event from bubbling up to the parent
                            console.log("Dispatching removeFavorite with symbol: ", `${fav.symbol}`);
                            dispatch(removeCryptoFavorite({symbol: fav.symbol}));
                        }} 
                    />
                </div>
                ))}
                </>
                ) : (
                    <div className='relative'>
                        <TbStarsFilled 
                        className='m-2 w-10 cursor-pointer' 
                        onClick={() => setShowDropdown(!showDropdown)}
                        />
                        {showDropdown && (
                            <div className='absolute top-full right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 overflow-hidden z-10'>
                                {favorites && favorites.map((fav, index) => (
                                    <div 
                                    id={fav.symbol} 
                                    className='flex items-center justify-center border'
                                    >
                                    <button
                                        key={index}
                                        className='block w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                                        onClick={() => handleClickFavorite(fav.symbol)}
                                        >
                                            {fav.symbol}
                                        </button>
                                        <AiFillStar 
                                            className='w-10 text-yellow-400 hover:scale-125 ease-in duration-200 cursor-pointer' 
                                            onClick={(e) => {
                                                e.stopPropagation(); // stops the event from bubbling up to the parent
                                                console.log("Dispatching removeFavorite with symbol: ", `${fav.symbol}`);
                                                dispatch(removeCryptoFavorite({symbol: fav.symbol}));
                                            }} 
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    </div>
    <div id='TradingPortal' className='w-full h-screen bg-[#000033]'>
        <div className='p-4 w-full h-full mx-auto flex justify-center items-center text-white'>
            <div ref={chartContainerRef} className='w-full h-full' />
        </div>
    </div>
    </>
  )
}

export default TradingPortalCrypto