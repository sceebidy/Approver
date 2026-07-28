import io
import sys

from parsers.stamper import _create_stamp_overlay, ApproverStamp

approvers = [
    ApproverStamp(role="pelaksanaan disetujui oleh", name="A", jabatan="Jabatan A", signed_at="now", verify_url="url1"),
    ApproverStamp(role="diperiksa oleh", name="B", jabatan="Jabatan B1", signed_at="now", verify_url="url2"),
    ApproverStamp(role="diperiksa oleh", name="B", jabatan="Jabatan B2", signed_at="now", verify_url="url3"),
    ApproverStamp(role="anggaran disetujui oleh", name="C", jabatan="Jabatan C", signed_at="now", verify_url="url4"),
]

column_centers = [100.0, 300.0, 500.0, 700.0]
box_top_y = 200.0
box_bottom_y = 100.0
page_width = 800.0
page_height = 800.0

try:
    buf = _create_stamp_overlay(page_width, page_height, approvers, column_centers, box_top_y, box_bottom_y)
    print("Successfully created stamp overlay.")
except Exception as e:
    print(f"Error: {e}")
