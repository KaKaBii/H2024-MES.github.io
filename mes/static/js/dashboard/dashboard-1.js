(function($) {
    "use strict";
    
// 函數：讀取 Excel 並更新圖表數據
//function loadExcelData() {
    // console.log("開始讀取 Excel 檔案...");

    // fetch('./data.xlsx')  // 替換為你的 Excel 檔案路徑
    //     .then(response => {
    //         if (!response.ok) {
    //             throw new Error("無法加載 Excel 檔案");
    //         }
    //         console.log("成功加載 Excel 檔案");
    //         return response.arrayBuffer();
    //     })
    //     .then(data => {
    //         const workbook = XLSX.read(new Uint8Array(data), { type: 'array' });

    //         // 讀取第一個工作表
    //         const sheetName = workbook.SheetNames[0];
    //         const worksheet = workbook.Sheets[sheetName];

    //         // 將指定範圍 (K1:M) 的工作表數據轉換為 JSON
    //         const jsonData = XLSX.utils.sheet_to_json(worksheet, { range: "K1:M" });

    //         // 將 Excel 數據轉換為 Morris Bar Chart 格式
    //         const chartData = jsonData.map(item => ({
    //             y: item['date'],    // 假設 K 列代表日期
    //             a: item['good_rate'],  // 假設 L 列代表良率
    //             b: item['defeat_rate']   // 假設 M 列代表不良率
    //         }));

    //         console.log("更新圖表數據：", chartData);
    //         // 更新 Morris Bar Chart 數據
    //         barChart.setData(chartData);
    //     })
    //     .catch(error => console.error('Error loading Excel file:', error));
    // }

    //Morris bar chart
    var barChart =  Morris.Bar({
        element: 'morris-bar-chart',
        data:  [{
                y: '8/14',
                a: 80,
                b: 20
            }, {
                y: '8/16',
                a: 88,
                b: 12
            }, {
                y: '8/17',
                a: 90,
                b: 10
            }, {
                y: '8/18',
                a: 82,
                b: 18
            }, {
                y: '8/19',
                a: 93,
                b: 7
            }, {
                y: '8/20',
                a: 76,
                b: 24
            }, {
                y: '8/21',
                a: 90,
                b: 10}
        ],
        xkey: 'y',
        ykeys: ['a', 'b'],
        labels: ['良率', '不良率'],
        barColors: ['#343957', '#5873FE'],
        hideHover: 'auto',
        gridLineColor: '#eef0f2',
        resize: true
    });
    $('#info-circle-card').circleProgress({
        value: 0.92,
        size: 70,
        startAngle: -Math.PI / 2 // 使起始方向朝向上方
        ,
        fill: {
            gradient: ["#a389d5"]
        }
        
    });

    $('.testimonial-widget-one .owl-carousel').owlCarousel({
        singleItem: true,
        loop: true,
        autoplay: false,
        //        rtl: true,
        autoplayTimeout: 2500,
        autoplayHoverPause: true,
        margin: 10,
        nav: false,
        dots: false,
        responsive: {
            0: {
                items: 1
            },
            600: {
                items: 1
            },
            1000: {
                items: 1
            }
        }
    });

    $('#vmap13').vectorMap({
        map: 'usa_en',
        backgroundColor: 'transparent',
        borderColor: 'rgb(88, 115, 254)',
        borderOpacity: 0.25,
        borderWidth: 1,
        color: 'rgb(88, 115, 254)',
        enableZoom: true,
        hoverColor: 'rgba(88, 115, 254)',
        hoverOpacity: null,
        normalizeFunction: 'linear',
        scaleColors: ['#b6d6ff', '#005ace'],
        selectedColor: 'rgba(88, 115, 254, 0.9)',
        selectedRegions: null,
        showTooltip: true,
        // onRegionClick: function(element, code, region) {
        //     var message = 'You clicked "' +
        //         region +
        //         '" which has the code: ' +
        //         code.toUpperCase();

        //     alert(message);
        // }
    });

    var nk = document.getElementById("sold-product");
    // nk.height = 50
    new Chart(nk, {
        type: 'pie',
        data: {
            defaultFontFamily: 'Poppins',
            datasets: [{
                data: [45, 25, 20, 10],
                borderWidth: 0,
                backgroundColor: [
                    "rgba(89, 59, 219, .9)",
                    "rgba(89, 59, 219, .7)",
                    "rgba(89, 59, 219, .5)",
                    "rgba(89, 59, 219, .07)"
                ],
                hoverBackgroundColor: [
                    "rgba(89, 59, 219, .9)",
                    "rgba(89, 59, 219, .7)",
                    "rgba(89, 59, 219, .5)",
                    "rgba(89, 59, 219, .07)"
                ]

            }],
            labels: [
                "one",
                "two",
                "three",
                "four"
            ]
        },
        options: {
            responsive: true,
            legend: false,
            maintainAspectRatio: false
        }
    });

    $(document).ready(function() {
        // 從後端獲取 Excel 數據
        $.getJSON('/get_chart_data', function(data) {
            if (data.error) {
                console.error("後端錯誤:", data.error);
                alert("無法獲取數據。請檢查後端日誌以獲取更多信息。");
                return;
            }
    
            // 構造 Morris.Bar 所需的數據格式
            var chartData = data.date.map(function(date, index) {
                return {
                    date: date,
                    good_rate: data.good_rate[index],
                    defect_rate: data.defect_rate[index]
                };
            });
    
            // 初始化 Morris.Bar 圖表
            Morris.Bar({
                element: 'morris-bar-chart',      // 設定圖表容器
                data: chartData,                  // 使用你的 JSON 資料
                xkey: 'date',                     // X 軸為日期
                ykeys: ['good_rate', 'defect_rate'],  // Y 軸顯示良率和不良率
                labels: ['良率', '不良率'],             // 顯示的標籤名稱
                barColors: ['#00a65a', '#f56954'],  // 設定柱狀圖顏色
                hideHover: 'auto',                 // 滑鼠懸停自動顯示
                gridLineColor: '#eef0f2',          // 網格線顏色
                resize: true                       // 自動調整大小
            });
        }).fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.error("請求失敗: " + err);
            alert("獲取或處理數據時出錯。請檢查控制台以獲取更多細節。");
        });
    });
})(jQuery);

(function($) {
    "use strict";

    var data = [],
        totalPoints = 300;

    function getRandomData() {

        if (data.length > 0)
            data = data.slice(1);

        // Do a random walk

        while (data.length < totalPoints) {

            var prev = data.length > 0 ? data[data.length - 1] : 50,
                y = prev + Math.random() * 10 - 5;

            if (y < 0) {
                y = 0;
            } else if (y > 100) {
                y = 100;
            }

            data.push(y);
        }

        // Zip the generated y values with the x values

        var res = [];
        for (var i = 0; i < data.length; ++i) {
            res.push([i, data[i]])
        }

        return res;
    }

    // Set up the control widget

    var updateInterval = 30;
    $("#updateInterval").val(updateInterval).change(function() {
        var v = $(this).val();
        if (v && !isNaN(+v)) {
            updateInterval = +v;
            if (updateInterval < 1) {
                updateInterval = 1;
            } else if (updateInterval > 3000) {
                updateInterval = 3000;
            }
            $(this).val("" + updateInterval);
        }
    });

    var plot = $.plot("#cpu-load", [getRandomData()], {
        series: {
            shadowSize: 0 // Drawing is faster without shadows
        },
        yaxis: {
            min: 0,
            max: 100
        },
        xaxis: {
            show: false
        },
        colors: ["#007BFF"],
        grid: {
            color: "transparent",
            hoverable: true,
            borderWidth: 0,
            backgroundColor: 'transparent'
        },
        tooltip: true,
        tooltipOpts: {
            content: "Y: %y",
            defaultTheme: false
        }


    });

    function update() {

        plot.setData([getRandomData()]);

        // Since the axes don't change, we don't need to call plot.setupGrid()

        plot.draw();
        setTimeout(update, updateInterval);
    }

    update();


})(jQuery);


const wt = new PerfectScrollbar('.widget-todo');
const wtl = new PerfectScrollbar('.widget-timeline');