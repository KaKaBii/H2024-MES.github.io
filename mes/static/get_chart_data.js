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
