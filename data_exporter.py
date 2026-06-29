import sqlite3
import csv
import sys
import os

def export_to_csv(db_path="server/data/database.sqlite", output_path="competitor_export.csv"):
    """
    Exports intelligence cards from the SQLite database to a CSV file.
    This is an independent utility script and is not connected to the main app.
    """
    if not os.path.exists(db_path):
        print(f"Error: Database file not found at {db_path}")
        return False
        
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        query = """
            SELECT 
                ic.id,
                c.name as competitor_name,
                c.url as competitor_url,
                ic.category,
                ic.impact_score,
                ic.summary,
                ic.justification,
                ic.recommendation,
                ic.timestamp
            FROM intelligence_cards ic
            JOIN competitors c ON ic.competitor_id = c.id
            ORDER BY ic.timestamp DESC
        """
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        headers = [
            "Card ID", "Competitor Name", "Competitor URL", 
            "Category", "Impact Score", "Summary", 
            "Justification", "Recommended Action", "Detected Timestamp"
        ]
        
        with open(output_path, mode='w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            writer.writerows(rows)
            
        print(f"Successfully exported {len(rows)} competitor intelligence logs to {output_path}")
        return True
    except Exception as e:
        print(f"Error during export: {e}")
        return False
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    export_to_csv()
