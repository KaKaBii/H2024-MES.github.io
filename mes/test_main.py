from flask import Flask, render_template, jsonify, session
import os
import pandas as pd

app = Flask(__name__)


# 讀取 Excel 並將其轉換為 JSON 格式
def read_excel_data():
    # 獲取當前工作目錄
    current_path = os.getcwd()
    print("當前工作目錄:", current_path)

    # 拼接文件路徑
    file_path = os.path.join(current_path, './sql/data.xlsx')

    # 檢查文件是否存在
    if os.path.exists(file_path):
        print(f"文件 '{file_path}' 存在，開始讀取數據...")
        try:
            df = pd.read_excel(file_path)
        except Exception as e:
            print(f"讀取 Excel 文件時出錯: {e}")
            return {}
    else:
        print(f"文件 '{file_path}' 不存在，請檢查文件名和路徑是否正確。")
        return {}

    # 假設 K、L、M 列分別是 'date'、'good_rate'、'defect_rate'
    # Excel 列索引從 0 開始，K=10，L=11，M=12
    try:
        selected_columns = df.iloc[:, [10, 11, 12]]  # K, L, M
        selected_columns.columns = ['date', 'good_rate', 'defect_rate']  # 重命名列
    except IndexError:
        print("選擇的列超出範圍，請確認 data.xlsx 中有足夠的列。")
        return {}
    except Exception as e:
        print(f"處理 Excel 數據時出錯: {e}")
        return {}

    # 處理日期格式（如果需要）
    if 'date' in selected_columns.columns:
        try:
            selected_columns['date'] = pd.to_datetime(selected_columns['date']).dt.strftime('%Y-%m-%d')
        except Exception as e:
            print(f"處理日期格式時出錯: {e}")

    return selected_columns.to_dict(orient='list')

@app.route('/', methods=['GET'])
def index1():
    username = session.get('username')
    return render_template('index1.html', username=username)

@app.route('/get_chart_data', methods=['GET'])
def get_chart_data():
    data = read_excel_data()
    if not data:
        return jsonify({"error": "無法讀取數據"}), 500
    return jsonify(data)

if __name__ == '__main__':
    app.run(debug=True)
