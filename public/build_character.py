import bpy, os, re

# -------- SETTINGS --------
SRC      = r"D:\work\backup2025\Qasim\3D-Chatbot-Chiko\3D-Chatbot-Chiko\public"
OUTDIR   = r"D:\work\backup2025\Qasim\3D-Chatbot-Chiko\3D-Chatbot-Chiko\public\models"
OUTFILE  = os.path.join(OUTDIR, "character.glb")
# --------------------------

# ---------- Common ----------
def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def import_base_model():
    glb  = os.path.join(SRC, "model.glb")
    gltf = os.path.join(SRC, "scene.gltf")
    if os.path.exists(glb):
        bpy.ops.import_scene.gltf(filepath=glb); print("Imported base: model.glb")
    elif os.path.exists(gltf):
        bpy.ops.import_scene.gltf(filepath=gltf); print("Imported base: scene.gltf")
    else:
        raise FileNotFoundError("No base GLB/GLTF found in: " + SRC)

def find_main_armature():
    arms = [o for o in bpy.data.objects if o.type == 'ARMATURE']
    if not arms: raise RuntimeError("No armature found in scene.")
    arms.sort(key=lambda a: len(a.data.bones), reverse=True)
    print("Using armature:", arms[0].name)
    return arms[0]

def get_socket(node, *names):
    want = [n.lower() for n in names]
    for inp in node.inputs:
        if inp.name.lower() in want: return inp
    return None

# ---------- Materials ----------
def make_basic_material_with_textures():
    diffuse  = os.path.join(SRC, "Ch03_Body_diffuse.png")
    normal   = os.path.join(SRC, "Ch03_Body_normal.png")
    specglos = os.path.join(SRC, "Ch03_Body_specularGlossiness.png")
    if not os.path.exists(diffuse):
        print("No diffuse texture found; skipping material setup."); return

    mat = bpy.data.materials.get("Body_MAT") or bpy.data.materials.new("Body_MAT")
    mat.use_nodes = True; nt = mat.node_tree; nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial"); out.location = (400,0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled"); bsdf.location = (80,0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    # Base Color
    tex_col = nt.nodes.new("ShaderNodeTexImage"); tex_col.location = (-400, 150)
    tex_col.image = bpy.data.images.load(diffuse)
    bc = get_socket(bsdf, "Base Color")
    if bc: nt.links.new(tex_col.outputs["Color"], bc)

    # Normal
    if os.path.exists(normal):
        tex_n  = nt.nodes.new("ShaderNodeTexImage"); tex_n.location = (-650,-100)
        tex_n.image = bpy.data.images.load(normal); tex_n.image.colorspace_settings.name = 'Non-Color'
        nrm = nt.nodes.new("ShaderNodeNormalMap"); nrm.location = (-350,-100)
        nt.links.new(tex_n.outputs["Color"], nrm.inputs["Color"])
        nrm_socket = get_socket(bsdf, "Normal")
        if nrm_socket: nt.links.new(nrm.outputs["Normal"], nrm_socket)

    # Spec/Gloss approx
    if os.path.exists(specglos):
        tex_s = nt.nodes.new("ShaderNodeTexImage"); tex_s.location = (-650, -380)
        tex_s.image = bpy.data.images.load(specglos); tex_s.image.colorspace_settings.name = 'Non-Color'
        sep = nt.nodes.new("ShaderNodeSeparateRGB"); sep.location = (-420,-380)
        inv = nt.nodes.new("ShaderNodeInvert"); inv.location = (-200,-380)
        nt.links.new(tex_s.outputs["Color"], sep.inputs["Image"])
        nt.links.new(sep.outputs["G"], inv.inputs["Color"])
        rough_socket = get_socket(bsdf, "Roughness")
        if rough_socket: nt.links.new(inv.outputs["Color"], rough_socket)
        spec_socket = get_socket(bsdf, "Specular IOR Level", "Specular")
        if spec_socket: nt.links.new(sep.outputs["G"], spec_socket)

    # Assign to meshes that have no material
    for obj in [o for o in bpy.data.objects if o.type == 'MESH']:
        if not obj.data.materials: obj.data.materials.append(mat)

# ---------- Bone remap (prefix match) ----------
def build_prefix_map(target_bones):
    """
    For a target bone like 'mixamorig:RightFoot_062', create keys:
      - 'mixamorig:RightFoot'
      - 'RightFoot'
    mapping -> the actual full name 'mixamorig:RightFoot_062'.
    """
    m = {}
    for tb in target_bones:
        # full with prefix, but remove trailing _### (and optional _End labels are kept)
        base = re.sub(r'_\d+$', '', tb)
        m.setdefault(base, tb)
        if "mixamorig:" in base:
            m.setdefault(base.split("mixamorig:")[-1], tb)
    return m

def remap_action_to_target(act, prefix_map):
    for fc in act.fcurves:
        dp = fc.data_path
        m = re.search(r'pose\.bones\["([^"]+)"\]', dp)
        if not m: continue
        src = m.group(1)
        # Try exact
        if src in prefix_map:
            tgt = prefix_map[src]
        else:
            # Try with/without mixamorig:
            key = src.split("mixamorig:")[-1]
            tgt = prefix_map.get(src) or prefix_map.get(key)
        if tgt and tgt != src:
            fc.data_path = dp.replace(src, tgt)

# ---------- Import animations ----------
CLIP_NAME_RULES = [
    ("angry",    "Angry"),
    ("talk",     "Talking"),
    ("wave",     "Waving"),
    ("gesture",  "Waving"),
    ("defeat",   "Defeated"),
    ("sad",      "Defeated"),
]

def clip_name_from_filename(fn):
    base = os.path.splitext(os.path.basename(fn))[0].lower()
    for key, nice in CLIP_NAME_RULES:
        if key in base: return nice
    return os.path.splitext(os.path.basename(fn))[0]

def clean_nla_tracks(ad, keep_names):
    # remove tracks with junk names like 'mixamo.com' or duplicates
    if not ad or not ad.nla_tracks: return
    for tr in list(ad.nla_tracks):
        if tr.name not in keep_names:
            ad.nla_tracks.remove(tr)

def import_fbx_animations(main_arm):
    fbx_files = sorted([f for f in os.listdir(SRC) if f.lower().endswith(".fbx")])
    if not fbx_files:
        print("No FBX animations found."); return

    target_bones = {b.name for b in main_arm.data.bones}
    prefix_map   = build_prefix_map(target_bones)

    # Ensure animation_data exists
    if not main_arm.animation_data:
        main_arm.animation_data_create()
    ad = main_arm.animation_data

    desired_clip_names = []

    for f in fbx_files:
        path = os.path.join(SRC, f)
        clip_name = clip_name_from_filename(f)
        desired_clip_names.append(clip_name)
        print(f"Importing FBX (animations only): {path} → clip '{clip_name}'")

        pre_objs    = set(bpy.data.objects)
        pre_actions = set(bpy.data.actions)

        bpy.ops.import_scene.fbx(filepath=path, automatic_bone_orientation=True)

        new_objs    = [o for o in bpy.data.objects if o not in pre_objs]
        new_actions = [a for a in bpy.data.actions if a not in pre_actions]

        # Remap bone names for each new action
        for act in new_actions:
            remap_action_to_target(act, prefix_map)
            # rename action to the nice clip name so exporter uses it
            act.name = clip_name

        # Remove any existing track with same name (avoid duplicates)
        if ad.nla_tracks:
            for tr in list(ad.nla_tracks):
                if tr.name == clip_name:
                    ad.nla_tracks.remove(tr)

        # Create a single NLA track for this clip
        if not new_actions:
            print("  (No actions found in this FBX)")
        else:
            act = new_actions[0]  # most FBXs contain one action
            tr = ad.nla_tracks.new(); tr.name = clip_name
            st = tr.strips.new(clip_name, int(act.frame_range[0]), act)
            st.action_frame_start = act.frame_range[0]
            st.action_frame_end   = act.frame_range[1]
            print("  Added action:", act.name, "→ track:", tr.name)

        # Delete imported rigs/meshes; keep only actions
        bpy.ops.object.select_all(action='DESELECT')
        for o in new_objs: o.select_set(True)
        bpy.ops.object.delete(use_global=False, confirm=False)
        bpy.ops.outliner.orphans_purge(do_recursive=True)

    # Clean unwanted tracks (e.g., 'mixamo.com')
    clean_nla_tracks(ad, set(desired_clip_names))

# ---------- Finalize ----------
def center_and_apply_transforms():
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects: o.select_set(o.type in {'MESH','ARMATURE'})
    bpy.ops.object.transform_apply(location=False, rotation=True, scale=True)

def pack_and_export(outfile):
    os.makedirs(os.path.dirname(outfile), exist_ok=True)
    bpy.ops.file.pack_all()
    bpy.ops.export_scene.gltf(filepath=outfile,
                              export_format='GLB',
                              export_yup=True,
                              export_apply=True,
                              export_animations=True,
                              export_skins=True,
                              export_nla_strips=True,
                              export_morph=True,
                              export_texcoords=True,
                              export_normals=True)
    print("Exported:", outfile)

# -------- RUN PIPELINE --------
reset_scene()
import_base_model()
arm = find_main_armature()
make_basic_material_with_textures()
import_fbx_animations(arm)
center_and_apply_transforms()
pack_and_export(OUTFILE)
