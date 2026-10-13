from app import create_app
from app.extensions import db
from app.models import Device, Module, ModulePosition, ModuleRequest, DeviceType
from sqlalchemy import func

app = create_app()

with app.app_context():
    print("=== STATISTIK DASHBOARD ===")
    print("Total Devices:", Device.query.count())
    print("Total Modules:", Module.query.count())

    result = db.session.query(
        func.count(func.distinct(ModulePosition.module_id))
    ).filter(
        ModulePosition.status == "aktif"
    ).scalar()

    print("Modul Terpasang:", result or 0)

    print(
        "Pending Approval:",
        ModuleRequest.query.filter_by(status="PENDING").count()
    )

    print("\n=== DISTRIBUSI PERANGKAT ===")

    dist = db.session.query(
        DeviceType.nama_tipe,
        func.count(Device.device_id).label("count")
    ).join(
        Device, Device.device_type_id == DeviceType.device_type_id
    ).group_by(
        DeviceType.nama_tipe
    ).all()

    for name, count in dist:
        print(f"  {name}: {count}")

    print("\n=== KONDISI MODUL ===")

    kondisi = db.session.query(
        Module.kondisi,
        func.count(Module.modul_id).label("count")
    ).group_by(
        Module.kondisi
    ).all()

    for k, count in kondisi:
        print(f"  {k}: {count}")