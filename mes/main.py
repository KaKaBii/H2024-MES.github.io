from flask import Flask, request, jsonify, render_template, session, redirect, url_for, flash
from flask_cors import CORS 
from datetime import datetime
import flask_cors
import pandas as pd 
import secrets
import sqlite3
import logging
import traceback
import re 
import os
import gspread
from google.oauth2.service_account import Credentials

# 設定 Google Sheets API 授權
scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/spreadsheets",
         "https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive"]
creds = Credentials.from_service_account_file('igneous-walker-441614-j3-891f1d826df2.json', scopes=scope)
client = gspread.authorize(creds)


# 打開 Google Sheet
spreadsheet_id = "1uG_1YrsVX-U5fAQmkM6Izkf9F0zIfpuQhqm4ILcFV94"
spreadsheet = client.open_by_key(spreadsheet_id)
worksheet = spreadsheet.worksheet("Production report")
worksheet2 = spreadsheet.worksheet("Work order completion rate")


app = Flask(__name__)
CORS(app)
app.secret_key = secrets.token_hex(16)
# Initialize logging
logging.basicConfig(level=logging.INFO)

# 連接到資料庫，若資料庫不存在則會自動創建

    
def get_db_connection():
    try:
        conn = sqlite3.connect('./sql/mes.db')
        if not os.path.exists('./sql/mes.db'):
            logging.error(f"Database file not found at {'./sql/mes.db'}")
            return None

        conn = sqlite3.connect('./sql/mes.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        # 讀取 workplan 表中的 order, number, date 資料
        cursor.execute('SELECT "order", "number", "date" FROM workplan')
        data = cursor.fetchall()

        # 將每個 Row 物件轉換成列表
        data = [[row[0], row[1], row[2]] for row in data]

        # 清空工作表的 A、B、C 欄中的舊資料
        ("A2", [["Order", "Quantity", "Date"]])  # 設置標題
        worksheet.batch_clear(["A3:C"])
        worksheet2.batch_clear(["A3:C"])

        # 準備要寫入的資料（包括標題行）
        rows_to_update = [["Order", "Number", "Date"]] + data  # 將標題與資料結合

        # 一次性寫入所有資料，從 A2 欄開始
        worksheet.update("A2:C" + str(len(rows_to_update) + 1), rows_to_update)
        worksheet2.update("A2:C" + str(len(rows_to_update) + 1), rows_to_update)
        return conn
    except sqlite3.Error as e:
        logging.error(f"Database connection error: {e}")
        return None


def login_user(username, password):
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? AND password = ?", (username, password))
            user = cursor.fetchone()
            if user:
                return {"status": "success", "message": "Login successful"}
            else:
                return {"status": "error", "message": "Invalid username or password"}
        except sqlite3.Error as e:
            logging.error(f"Database query error: {e}")
            return {"status": "error", "message": "An error occurred"}
        finally:
            conn.close()
    else:
        return {"status": "error", "message": "Database connection error"}
    

# Create tables
def create_tables():
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS workplan (
                    id       INTEGER,
                    plan     TEXT    NOT NULL,
                    product  TEXT    NOT NULL,
                    number   INTEGER NOT NULL,
                    material TEXT    NOT NULL,
                    date     TEXT    NOT NULL,
                    time     TEXT    NOT NULL,
                    [order]  TEXT    PRIMARY KEY
                                    NOT NULL
                )
            ''')


            conn.commit()
        except sqlite3.Error as e:
            logging.error(f"Error creating table: {e}")
        finally:
            conn.close()

create_tables()
# Create tables
def create_user_tables():
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    username TEXT PRIMARY KEY
                                NOT NULL,
                    password TEXT NOT NULL,
                    email    TEXT NOT NULL
                )
            ''')
            conn.commit()
        except sqlite3.Error as e:
            logging.error(f"Error creating table: {e}")
        finally:
            conn.close()

create_user_tables()

# Create tables
def create_checklist():
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
             # 建立 checktables 表格
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS checktables (
                    table_name TEXT PRIMARY KEY,
                    time TEXT NOT NULL
                )
            ''')
             # 建立 checklists 表格
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS checklists (
                    item_id TEXT PRIMARY KEY,
                    table_name TEXT NOT NULL,
                    item_name TEXT NOT NULL,
                    description TEXT,
                    checkway TEXT,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (table_name) REFERENCES checktables(table_name)
                )
            ''')
            conn.commit()
        except sqlite3.Error as e:
            logging.error(f"Error creating table: {e}")
        finally:
            conn.close()

create_checklist()

@app.route('/api/saveChecklist', methods=['POST'])
def save_checklist():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "未授權，請登入"}), 401

    data = request.get_json()
    table_name = data.get('tableName')
    items = data.get('items')

    if not table_name or not items:
        return jsonify({'status': 'error', 'message': '缺少點檢表名稱或項目資料。'}), 400

    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
             # 先清空指定點檢表名稱的所有項目
            cursor.execute("DELETE FROM checklists WHERE table_name = ?", (table_name,))


            # 插入到 checktables 表
            cursor.execute("INSERT OR IGNORE INTO checktables (table_name, time) VALUES (?, ?)", (table_name, datetime.now().isoformat()))

            # 獲取當前點檢表名稱下已有的項目數量
            cursor.execute("SELECT COUNT(*) FROM checklists WHERE table_name = ?", (table_name,))
            current_count = cursor.fetchone()[0]
            
            new_items = []
            for i, item in enumerate(items, start=1):
                # 生成新的 ID：點檢表名稱 + 序號
                new_id = f"{table_name}{current_count + i}"
                new_items.append((
                    new_id,
                    table_name,
                    item['itemName'],
                    item['description'],
                    item['checkway'],
                    item['timestamp']
                ))
            
            # 插入所有新項目到 checklists 表
            cursor.executemany('''
                INSERT INTO checklists (item_id, table_name, item_name, description, checkway, timestamp)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', new_items)
            
            conn.commit() # 確保提交交易
    
            logging.info(f"checklists '{table_name}' saved successfully with {len(new_items)} items.")
            return jsonify({'status': 'success', 'message': '點檢表儲存成功'}), 200
        except sqlite3.IntegrityError as e:
            conn.rollback()  # 在發生錯誤時回滾交易
            logging.error(f"Integrity error: {e}")
            return jsonify({'status': 'error', 'message': 'ID 重複或其他資料庫完整性錯誤'}), 400
        except Exception as e:
            conn.rollback()  # 在發生錯誤時回滾交易
            logging.error(f"Error saving checklists: {e}")
            traceback.print_exc()
            return jsonify({'status': 'error', 'message': '伺服器錯誤。'}), 500
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"}), 500

@app.route('/api/getChecklists', methods=['GET'])
def get_checklists():
    if 'username' not in session:
        return jsonify({"status": "error", "message": "未授權，請登入"}), 401

    table_name = request.args.get('tableName')
    if not table_name:
        return jsonify({"status": "error", "message": "缺少點檢表名稱"}), 400

    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute('SELECT * FROM checklists WHERE table_name = ?', (table_name,))
            rows = cursor.fetchall()
            checklists = []
            for row in rows:
                checklists = {
                    'item_id': row['item_id'],
                    'table_name': row['table_name'],
                    'item_name': row['item_name'],
                    'description': row['description'],
                    'checkway': row['checkway'],
                    'timestamp': row['timestamp']
                }
                checklists.append(checklists)
            return jsonify({'status': 'success', 'checklists': checklists}), 200
        except sqlite3.Error as e:
            print(f"Error fetching checklists items: {e}")
            logging.error(f"Error fetching checklists: {e}")
            return jsonify({'status': 'error', 'message': '資料庫錯誤。'}), 500
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"}), 500


@app.route('/api/get_checktable', methods=['GET'])
def get_checktables():
    try:
        # Connect to the database
        conn = get_db_connection()
        cursor = conn.cursor()

        # Query the checktables table
        cursor.execute("SELECT table_name, time FROM checktables ORDER BY time DESC")
        rows = cursor.fetchall()

        # Format the data
        result = [
            {"serial": i + 1, "table_name": row[0], "create_date": row[1]}
            for i, row in enumerate(rows)
        ]

        # Return JSON data
        return jsonify(result), 200
    except sqlite3.Error as e:
        # Error handling
        print(f"Database error occurred: {e}")
        return jsonify({'status': 'error', 'message': 'Database error occurred.'}), 500
    except Exception as e:
        # General error handling
        print(f"Error fetching checktable: {e}")
        return jsonify({'status': 'error', 'message': 'Server error.'}), 500
    finally:
        # Close the database connection
        if conn:
            conn.close()

@app.route('/api/get_checklist_items', methods=['GET'])
def get_checklist_items():
    table_name = request.args.get('table_name')
    if not table_name:
        return jsonify({'status': 'error', 'message': 'Table name is required.'}), 400
    
    try:
        # 連接到資料庫
        conn = get_db_connection()
        cursor = conn.cursor()

        # 查詢 checklist 表格中的資料
        cursor.execute("SELECT item_name, description, checkway, timestamp FROM checklists WHERE table_name = ?", (table_name,))
        rows = cursor.fetchall()

        # 格式化資料
        result = [
            {"item_name": row[0], "description": row[1], "checkway": row[2], "timestamp": row[3]}
            for row in rows
        ]

        # 返回 JSON 資料
        return jsonify(result), 200
    except Exception as e:
        # 錯誤處理
        print(f"Error fetching checklists items: {e}")
        return jsonify({'status': 'error', 'message': '伺服器錯誤。'}), 500
    finally:
        # 關閉資料庫連接
        conn.close()

# 讀取 Excel 並將其轉換為 JSON 格式
'''def read_excel_data():
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
        selected_columns.columns = ['good_rate', 'defect_rate','date']  # 重命名列
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

    return selected_columns.to_dict(orient='list')'''

@app.route('/', methods=['GET'])
def index():
    username = session.get('username')
    return render_template('index.html', username=username)

'''@app.route('/get_chart_data', methods=['GET'])
def get_chart_data():
    data = read_excel_data()
    if not data:
        return jsonify({"error": "無法讀取數據"}), 500
    return jsonify(data)'''

@app.route('/page_login' , methods=['GET', 'POST'])
def page_login():
    try:
        if request.method == 'POST':
            data = request.get_json()
            username = data.get('username')
            password = data.get('password')
            result = login_user(username, password)
            if result["status"] == "success":
                session['username'] = username
            return jsonify(result)
        return render_template('page_login.html')
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/page_register', methods=['GET', 'POST'])
def page_register():
    if request.method == 'POST':
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')

        conn = sqlite3.connect('./sql/mes.db')
        c = conn.cursor()
        c.execute("SELECT * FROM users WHERE username = ?", (username,))
        existing_user = c.fetchone()
        if existing_user:
            return jsonify({"status": "error", "message": "此名稱已被使用"})

        if len(password) < 8:
                    return jsonify({"status": "error", "message": "密碼必須超過八個字元"})
        if not re.match(r'^[^@]+@gmail\.com$', email):
            return jsonify({"status": "error", "message": "電子郵件格式錯誤"})

        c.execute("INSERT INTO users (username, password, email) VALUES (?, ?, ?)", (username, password, email))
        conn.commit()
        conn.close()
        return jsonify({"status": "success", "message": "註冊成功"})
    return render_template('page_register.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    flash('You were successfully logged out', 'success')
    session.pop('username', None)
    return redirect(url_for('index'))
    '''session.pop('username', None)
    return redirect(url_for('page_login.html'))'''


@app.route('/table_workplan')
def table_workplan():
    if 'username' in session:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM workplan')
        workplans = cursor.fetchall()  # Fetch all rows from the database
        conn.close()
        return render_template('table_workplan.html', workplans=workplans)
    else:
        return redirect(url_for('page_login'))

@app.route('/get_workplan_data', methods=['GET'])
def get_workplan_data():
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, plan, product, number, material, date, time, \"order\" FROM workplan")
            rows = cursor.fetchall()
            
            # 将数据转换为 JSON 格式
            data = [{'id': row[0], 'plan': row[1], 'product': row[2], 'number': row[3], 'material': row[4], 'date': row[5], 'time': row[6], 'order': row[7]} for row in rows]
            
            return jsonify(data)
        except sqlite3.Error as e:
            logging.error(f"Database query error: {e}")
            return jsonify({"status": "error", "message": "資料庫錯誤"})
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"})

@app.route('/save_workplan', methods=['POST'])
def save_workplan():
    data = request.get_json()
    plan = data.get('plan')
    product = data.get('product')
    number = data.get('number')
    material = data.get('material')
    date = data.get('date')
    time = data.get('time')
    order = f"{plan}{product}{material}"
    print(data, plan)

    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            
            # 获取当前最大 ID
            cursor.execute("SELECT MAX(id) FROM workplan")
            max_id = cursor.fetchone()[0]
            new_id = max_id + 1 if max_id is not None else 1
            
            # 检查订单是否已存在
            cursor.execute("SELECT * FROM workplan WHERE \"order\" = ?", (order,))
            existing_record = cursor.fetchone()
            
            if existing_record:
                return jsonify({"status": "error", "message": "記錄已存在"})
            
            # 插入新记录
            cursor.execute("""
                INSERT INTO workplan (id, plan, product, number, material, date, time, "order")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_id, plan, product, number, material, date, time, order))
            
            conn.commit()
            logging.info(f"Data inserted successfully: {new_id}, {plan}, {product}, {number}, {material}, {date}, {time}, {order}")
            return jsonify({"status": "success", "message": "數據已成功保存"})
        except sqlite3.Error as e:
            logging.error(f"Database insert error: {e}")
            return jsonify({"status": "error", "message": "資料庫錯誤"})
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"})
    
@app.route('/table_TPM_checklist')
def table_TPM_checklist():
    if 'username' in session:
        return render_template('table_TPM_checklist.html')
    else:
        return redirect(url_for('page_login'))
    
@app.route('/table_MDS')
def table_MDS():
    if 'username' in session:
        return render_template('table_MDS.html')
    else:
        return redirect(url_for('page_login'))
    
@app.route('/table_monitor')
def table_monitor():
    if 'username' in session:
        return render_template('table_monitor.html')
    else:
        return redirect(url_for('page_login'))
    
@app.route('/table_WMS')
def table_WMS():
    if 'username' in session:
        return render_template('table_WMS.html')
    else:
        return redirect(url_for('page_login'))

@app.route('/chart_data', methods=['GET'])
def chart_data():
    

    return render_template('chart_data.html')
    """
    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            cursor.execute("SELECT id, plan, product, number, material, date, time, \"order\" FROM workplan")
            rows = cursor.fetchall()
            
            # 将数据转换为 JSON 格式
            data = [{'id': row[0], 'plan': row[1], 'product': row[2], 'number': row[3], 'material': row[4], 'date': row[5], 'time': row[6], 'order': row[7]} for row in rows]
            
            return jsonify(data)
        except sqlite3.Error as e:
            logging.error(f"Database query error: {e}")
            return jsonify({"status": "error", "message": "資料庫錯誤"})
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"})
    """
@app.route('/save_chart_data', methods=['POST'])
def save_chart_data():
    data = request.get_json()
    plan = data.get('plan')
    product = data.get('product')
    number = data.get('number')
    material = data.get('material')
    date = data.get('date')
    time = data.get('time')
    order = f"{plan}{product}{material}"
    print(data, plan)

    conn = get_db_connection()
    if conn is not None:
        try:
            cursor = conn.cursor()
            
            # 获取当前最大 ID
            cursor.execute("SELECT MAX(id) FROM workplan")
            max_id = cursor.fetchone()[0]
            new_id = max_id + 1 if max_id is not None else 1
            
            # 检查订单是否已存在
            cursor.execute("SELECT * FROM workplan WHERE \"order\" = ?", (order,))
            existing_record = cursor.fetchone()
            
            if existing_record:
                return jsonify({"status": "error", "message": "記錄已存在"})
            
            # 插入新记录
            cursor.execute("""
                INSERT INTO workplan (id, plan, product, number, material, date, time, "order")
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (new_id, plan, product, number, material, date, time, order))
            
            conn.commit()
            logging.info(f"Data inserted successfully: {new_id}, {plan}, {product}, {number}, {material}, {date}, {time}, {order}")
            return jsonify({"status": "success", "message": "數據已成功保存"})
        except sqlite3.Error as e:
            logging.error(f"Database insert error: {e}")
            return jsonify({"status": "error", "message": "資料庫錯誤"})
        finally:
            conn.close()
    else:
        return jsonify({"status": "error", "message": "資料庫連接失敗"})

@app.route('/test')
def test():
    if 'username' in session:
        return render_template('test.html')
    else:
        return redirect(url_for('page_login'))


if __name__ == '__main__':
    app.run(debug=True)



'''conn = sqlite3.connect('./sql/mes.db')
    c = conn.cursor()
    
    c.execute("SELECT password FROM users WHERE username = ?", (username,))
    result = c.fetchone()
    
    if result is None:
        return {"status": "error", "message": "錯誤的名稱"}
    
    stored_password = result[0]
    if stored_password != password:
        return {"status": "error", "message": "錯誤的密碼"}
    
    return {"status": "success", "message": "登入成功"}'''

