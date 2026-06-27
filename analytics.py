#!/usr/bin/env python3
import os
import sys
import sqlite3
import csv
import json
from datetime import datetime

# ANSI colors for beautiful terminal output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    END = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

# Resolve database file path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'server', 'data', 'database.sqlite')

def check_database():
    """Verify if the database file exists."""
    if not os.path.exists(DB_PATH):
        print(f"{Colors.FAIL}{Colors.BOLD}[Error]{Colors.END} SQLite Database not found at {DB_PATH}.")
        print("Please run the backend server first to initialize the database.")
        sys.exit(1)

def query_db(query, params=(), one=False):
    """Run a query and return rows."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    if not rows:
        return None
    return rows[0] if one else rows

def print_banner():
    print(f"{Colors.CYAN}{Colors.BOLD}" + "="*65)
    print(" 🕵️‍♂️  COMPETITOR INTELLIGENCE ENGINE - PYTHON ANALYTICS & EXPORTER")
    print("="*65 + f"{Colors.END}")

def get_stats():
    """Compile core metrics from the database."""
    # Profile
    profile = query_db("SELECT * FROM profile ORDER BY id DESC LIMIT 1", one=True)
    business_name = profile['business_name'] if profile else "Not configured"
    
    # Competitors
    competitors = query_db("SELECT COUNT(*) as count FROM competitors", one=True)
    total_competitors = competitors['count'] if competitors else 0
    
    # Intelligence Cards
    cards = query_db("SELECT COUNT(*) as count, AVG(impact_score) as avg_score FROM intelligence_cards", one=True)
    total_cards = cards['count'] if cards else 0
    avg_score = round(cards['avg_score'], 1) if cards and cards['avg_score'] else 0.0

    # Categories
    categories = query_db("SELECT category, COUNT(*) as count FROM intelligence_cards GROUP BY category")
    
    # Sync status
    sync_status = query_db("SELECT crm_sync_status, COUNT(*) as count FROM intelligence_cards GROUP BY crm_sync_status")

    return {
        "business_name": business_name,
        "total_competitors": total_competitors,
        "total_cards": total_cards,
        "avg_score": avg_score,
        "categories": categories or [],
        "sync_status": sync_status or []
    }

def display_dashboard(stats):
    """Print the dashboard layout to terminal."""
    print(f"\n{Colors.BOLD}[+] GENERAL METRICS{Colors.END}")
    print(f" • Business Profile:      {Colors.BOLD}{stats['business_name']}{Colors.END}")
    print(f" • Monitored Competitors: {Colors.GREEN}{stats['total_competitors']}{Colors.END}")
    print(f" • Total Intel Cards:     {Colors.GREEN}{stats['total_cards']}{Colors.END}")
    print(f" • Average Threat Score:  {Colors.WARNING}{stats['avg_score']} / 10{Colors.END}")

    print(f"\n{Colors.BOLD}[+] UPDATE TYPE DISTRIBUTION{Colors.END}")
    if stats['categories']:
        for cat in stats['categories']:
            print(f" • {cat['category'].capitalize()}: {Colors.CYAN}{cat['count']}{Colors.END}")
    else:
        print(" • No intelligence categories mapped yet.")

    print(f"\n{Colors.BOLD}[+] CRM SYNC STATUS{Colors.END}")
    if stats['sync_status']:
        for status in stats['sync_status']:
            color = Colors.GREEN if status['crm_sync_status'] == 'synced' else (Colors.FAIL if status['crm_sync_status'] == 'failed' else Colors.WARNING)
            print(f" • {status['crm_sync_status'].capitalize()}: {color}{status['count']}{Colors.END}")
    else:
        print(" • No sync activities recorded.")

def display_critical_updates():
    """Print top high-impact updates (score >= 7)."""
    print(f"\n{Colors.WARNING}{Colors.BOLD}[+] RECENT HIGH-THREAT SHIFTS (Impact >= 7){Colors.END}")
    critical_cards = query_db("""
        SELECT ic.*, c.name as competitor_name 
        FROM intelligence_cards ic
        JOIN competitors c ON ic.competitor_id = c.id
        WHERE ic.impact_score >= 7
        ORDER BY ic.timestamp DESC LIMIT 5
    """)
    
    if not critical_cards:
        print(" • No high-impact updates recorded in database.")
        return

    for card in critical_cards:
        print(f" {Colors.BOLD}---{Colors.END}")
        print(f" 🚨 {Colors.BOLD}{card['competitor_name']}{Colors.END} | Score: {Colors.FAIL}{card['impact_score']}/10{Colors.END} | {card['category'].upper()}")
        print(f" {Colors.BOLD}Summary:{Colors.END} {card['summary'].strip()}")
        print(f" {Colors.BOLD}Recommendation:{Colors.END} {card['recommendation'].strip()}")

def export_csv():
    """Export cards to a structured CSV file."""
    csv_file = os.path.join(BASE_DIR, 'competitor_intel_report.csv')
    cards = query_db("""
        SELECT ic.timestamp, c.name as competitor, c.url, ic.category, ic.impact_score, ic.summary, ic.justification, ic.recommendation, ic.crm_sync_status
        FROM intelligence_cards ic
        JOIN competitors c ON ic.competitor_id = c.id
        ORDER BY ic.timestamp DESC
    """)

    if not cards:
        print(f"{Colors.WARNING}No records to export.{Colors.END}")
        return

    with open(csv_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Timestamp', 'Competitor Name', 'URL', 'Category', 'Impact Score', 'Summary', 'Justification', 'Recommended Action', 'CRM Sync Status'])
        for card in cards:
            writer.writerow([
                card['timestamp'], card['competitor'], card['url'], card['category'],
                card['impact_score'], card['summary'], card['justification'], card['recommendation'],
                card['crm_sync_status']
            ])
    print(f"{Colors.GREEN}✓ CSV report exported successfully to: competitor_intel_report.csv{Colors.END}")

def export_markdown():
    """Export cards to an executive Markdown summary report."""
    md_file = os.path.join(BASE_DIR, 'competitor_intel_report.md')
    cards = query_db("""
        SELECT ic.timestamp, c.name as competitor, c.url, ic.category, ic.impact_score, ic.summary, ic.justification, ic.recommendation
        FROM intelligence_cards ic
        JOIN competitors c ON ic.competitor_id = c.id
        ORDER BY ic.timestamp DESC
    """)

    if not cards:
        print(f"{Colors.WARNING}No records to export.{Colors.END}")
        return

    stats = get_stats()
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

    with open(md_file, 'w', encoding='utf-8') as f:
        f.write(f"# 📊 Competitor Intelligence Executive Report\n\n")
        f.write(f"*Generated on: {now_str}*\n\n")
        f.write(f"## Executive Summary\n")
        f.write(f"- **Target Product**: {stats['business_name']}\n")
        f.write(f"- **Total Monitored Competitors**: {stats['total_competitors']}\n")
        f.write(f"- **Total Tracked Updates**: {stats['total_cards']}\n")
        f.write(f"- **Average Threat Impact Score**: {stats['avg_score']} / 10\n\n")
        
        f.write(f"## Intelligence Feed\n\n")
        for card in cards:
            emoji = "🔴" if card['impact_score'] >= 7 else ("🟡" if card['impact_score'] >= 4 else "🟢")
            f.write(f"### {emoji} {card['competitor']} - {card['category'].upper()}\n")
            f.write(f"- **Impact Score**: {card['impact_score']} / 10\n")
            f.write(f"- **URL**: [{card['url']}]({card['url']})\n")
            f.write(f"- **Timestamp**: `{card['timestamp']}`\n\n")
            f.write(f"#### Summary\n{card['summary']}\n\n")
            f.write(f"#### Justification\n{card['justification']}\n\n")
            f.write(f"#### Recommended Action\n{card['recommendation']}\n\n")
            f.write(f"---\n\n")
            
    print(f"{Colors.GREEN}✓ Markdown report exported successfully to: competitor_intel_report.md{Colors.END}")

def main():
    check_database()
    print_banner()
    
    stats = get_stats()
    display_dashboard(stats)
    display_critical_updates()
    
    print(f"\n{Colors.BOLD}[+] EXPORT OPTIONS{Colors.END}")
    export_csv()
    export_markdown()
    
    print(f"\n{Colors.CYAN}{Colors.BOLD}="*65 + f"{Colors.END}\n")

if __name__ == '__main__':
    main()
